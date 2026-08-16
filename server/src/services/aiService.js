const prisma = require('../config/prisma');
const MockProvider = require('../ai/providers/mockProvider');
const GeminiProvider = require('../ai/providers/geminiProvider');
const { aiOutputSchema } = require('../ai/validators');
const { NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

function getActiveProvider() {
  const providerType = process.env.AI_PROVIDER || 'gemini';
  if (providerType === 'mock') {
    return new MockProvider({ timeoutMs: 3000 });
  }
  return new GeminiProvider();
}

/**
 * Executes AI incident intelligence classification and logs outcomes to IncidentAIAnalysis.
 */
async function classifyIncident(adminUserRole, incidentId) {
  if (adminUserRole !== 'ADMIN') {
    throw new ForbiddenError("Access denied: only administrators can trigger AI classification");
  }

  // 1. Load Incident
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId }
  });
  if (!incident) {
    throw new NotFoundError("Incident not found");
  }

  // 2. Fetch canonical skills database list
  const allSkills = await prisma.skill.findMany();
  const skillsList = allSkills.map(s => s.name);

  const provider = getActiveProvider();
  let rawResponse;

  // 3. Dispatch AI Request
  try {
    rawResponse = await provider.classifyIncident({
      title: incident.title,
      description: incident.description,
      address: incident.address,
      skillsList
    });
  } catch (err) {
    // Record FAILED analysis
    const failedLog = await prisma.incidentAIAnalysis.create({
      data: {
        incidentId,
        provider: provider.constructor.name,
        model: provider.modelName || 'unknown',
        confidence: 0.0,
        status: 'FAILED',
        errorMessage: err.message
      }
    });
    return { success: false, applied: false, analysis: failedLog, error: err.message };
  }

  // 4. Parse JSON Response
  let parsed;
  try {
    parsed = JSON.parse(rawResponse);
  } catch (err) {
    const malformedLog = await prisma.incidentAIAnalysis.create({
      data: {
        incidentId,
        provider: provider.constructor.name,
        model: provider.modelName || 'unknown',
        confidence: 0.0,
        status: 'FAILED',
        errorMessage: `Malformed JSON response from AI: ${rawResponse.substring(0, 200)}`
      }
    });
    return { success: false, applied: false, analysis: malformedLog, error: "Malformed JSON response" };
  }

  // 5. Validate Output Schema with Zod
  const validationResult = aiOutputSchema.safeParse(parsed);
  if (!validationResult.success) {
    const errorMsg = JSON.stringify(validationResult.error.issues);
    const schemaLog = await prisma.incidentAIAnalysis.create({
      data: {
        incidentId,
        provider: provider.constructor.name,
        model: provider.modelName || 'unknown',
        confidence: parsed.confidence || 0.0,
        status: 'FAILED',
        errorMessage: `AI output failed Zod schema validation: ${errorMsg}`
      }
    });
    return { success: false, applied: false, analysis: schemaLog, error: "Validation constraints mismatch" };
  }

  const aiData = validationResult.data;

  // 6. Skill Mapping
  // Discard any suggested skills that do not exist in the canonical skills database
  const matchedSkills = allSkills.filter(s => aiData.requiredSkills.includes(s.name));
  const matchedSkillIds = matchedSkills.map(s => ({ id: s.id }));
  const matchedSkillNames = matchedSkills.map(s => s.name);

  let status = "IGNORED";
  let applied = false;

  // 7. Check Precedence & Confidence Tiers
  // If incident was classified by HUMAN, AI analysis runs but MUST NOT overwrite Incident properties
  if (incident.classificationSource === "HUMAN") {
    status = "IGNORED";
    applied = false;
  } else {
    if (aiData.confidence >= 0.80) {
      status = "APPLIED";
      applied = true;
    } else if (aiData.confidence >= 0.50) {
      status = "NEEDS_REVIEW";
      applied = true;
    } else {
      status = "IGNORED";
      applied = false;
    }
  }

  // 8. Write to database atomically
  const analysis = await prisma.$transaction(async (tx) => {
    const log = await tx.incidentAIAnalysis.create({
      data: {
        incidentId,
        provider: provider.constructor.name,
        model: provider.modelName,
        suggestedCategory: aiData.category,
        suggestedPriority: aiData.priority,
        suggestedPeopleAtRisk: aiData.peopleAtRisk,
        suggestedSkills: matchedSkillNames,
        confidence: aiData.confidence,
        reasoning: aiData.reasoning,
        status
      }
    });

    if (applied) {
      await tx.incident.update({
        where: { id: incidentId },
        data: {
          category: aiData.category,
          priority: aiData.priority,
          peopleAtRisk: aiData.peopleAtRisk,
          classificationSource: "AI",
          aiNeedsReview: status === "NEEDS_REVIEW",
          requiredSkills: {
            set: [],
            connect: matchedSkillIds
          }
        }
      });
    }

    return log;
  });

  return { success: true, applied, analysis };
}

/**
 * Retrieves past AI intelligence triage logs for an incident.
 */
async function getAIAnalyses(adminUserRole, incidentId) {
  if (adminUserRole !== 'ADMIN') {
    throw new ForbiddenError("Access denied: only administrators can view AI analysis logs");
  }

  const incidentExists = await prisma.incident.findUnique({
    where: { id: incidentId }
  });
  if (!incidentExists) {
    throw new NotFoundError("Incident not found");
  }

  return await prisma.incidentAIAnalysis.findMany({
    where: { incidentId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Admin override/review classification action. Takes absolute precedence.
 */
async function reviewIncidentAI(adminUserRole, incidentId, overrideData) {
  if (adminUserRole !== 'ADMIN') {
    throw new ForbiddenError("Access denied: only administrators can perform human review overrides");
  }

  const incident = await prisma.incident.findUnique({
    where: { id: incidentId }
  });
  if (!incident) {
    throw new NotFoundError("Incident not found");
  }

  // Validate skill IDs
  let matchedSkillIds = [];
  if (overrideData.requiredSkills && overrideData.requiredSkills.length > 0) {
    const skills = await prisma.skill.findMany({
      where: { id: { in: overrideData.requiredSkills } }
    });
    if (skills.length !== overrideData.requiredSkills.length) {
      throw new ValidationError([
        { field: "requiredSkills", message: "One or more provided skill IDs are invalid" }
      ]);
    }
    matchedSkillIds = skills.map(s => ({ id: s.id }));
  }

  const updated = await prisma.incident.update({
    where: { id: incidentId },
    data: {
      category: overrideData.category || incident.category,
      priority: overrideData.priority || incident.priority,
      peopleAtRisk: overrideData.peopleAtRisk !== undefined ? overrideData.peopleAtRisk : incident.peopleAtRisk,
      classificationSource: "HUMAN",
      aiNeedsReview: false,
      requiredSkills: {
        set: [],
        connect: matchedSkillIds
      }
    },
    include: {
      requiredSkills: true
    }
  });

  return updated;
}

module.exports = {
  classifyIncident,
  getAIAnalyses,
  reviewIncidentAI
};
