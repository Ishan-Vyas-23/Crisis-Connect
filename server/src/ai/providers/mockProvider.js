class MockProvider {
  constructor(config = {}) {
    this.config = config;
    this.modelName = "mock-triage-model-v1";
  }

  async classifyIncident({ title, description, address, skillsList }) {
    const combinedText = `${title} ${description}`.toLowerCase();

    // 1. Simulate Timeout
    if (combinedText.includes("trigger_timeout")) {
      await new Promise(resolve => setTimeout(resolve, this.config.timeoutMs || 3000));
      throw new Error("Provider request timed out (simulated)");
    }

    // 2. Simulate Missing Key or Unavailable
    if (combinedText.includes("trigger_unavailable")) {
      throw new Error("AI provider is currently unavailable (simulated)");
    }

    // 3. Simulate Malformed JSON Response
    if (combinedText.includes("trigger_malformed")) {
      return "Malformed Response: { category: FLOOD, ... invalid json";
    }

    // 4. Determine fields based on triggers or keywords
    let category = "OTHER";
    if (combinedText.includes("trigger_invalid_category")) {
      category = "INVALID_CATEGORY_NAME";
    } else if (combinedText.includes("fire")) {
      category = "FIRE";
    } else if (combinedText.includes("flood")) {
      category = "FLOOD";
    } else if (combinedText.includes("accident")) {
      category = "ACCIDENT";
    } else if (combinedText.includes("medical")) {
      category = "MEDICAL";
    }

    let priority = "MEDIUM";
    if (combinedText.includes("trigger_invalid_priority")) {
      priority = "INVALID_PRIORITY_NAME";
    } else if (combinedText.includes("critical") || combinedText.includes("trap") || combinedText.includes("die")) {
      priority = "CRITICAL";
    } else if (combinedText.includes("high")) {
      priority = "HIGH";
    }

    let peopleAtRisk = false;
    if (combinedText.includes("trap") || combinedText.includes("people_at_risk") || combinedText.includes("injur")) {
      peopleAtRisk = true;
    }

    let requiredSkills = [];
    if (combinedText.includes("trigger_unknown_skill")) {
      requiredSkills = ["UNKNOWN_SKILL"];
    } else {
      if (category === "FLOOD") {
        requiredSkills.push("SWIMMING");
      }
      if (category === "MEDICAL" || combinedText.includes("first aid") || combinedText.includes("blood")) {
        requiredSkills.push("FIRST_AID");
      }
    }

    let confidence = 0.90;
    if (combinedText.includes("trigger_low_confidence")) {
      confidence = 0.35;
    } else if (combinedText.includes("trigger_medium_confidence")) {
      confidence = 0.65;
    } else if (combinedText.includes("trigger_high_confidence")) {
      confidence = 0.95;
    }

    const reasoning = `Mock reasoning: detected keywords in incident description matching category ${category}.`;

    const result = {
      category,
      priority,
      peopleAtRisk,
      requiredSkills,
      confidence,
      reasoning
    };

    return JSON.stringify(result);
  }
}

module.exports = MockProvider;
