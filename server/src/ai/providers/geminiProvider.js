const { buildIncidentTriagePrompt } = require('../promptBuilder');

class GeminiProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey || process.env.AI_API_KEY;
    this.modelName = config.modelName || process.env.AI_MODEL || "gemini-2.5-flash";
    this.timeoutMs = config.timeoutMs || parseInt(process.env.AI_TIMEOUT_MS, 10) || 10000;
  }

  async classifyIncident({ title, description, address, skillsList }) {
    if (!this.apiKey) {
      throw new Error("Gemini API key is missing. Set the AI_API_KEY environment variable.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:generateContent?key=${this.apiKey}`;
    
    const prompt = buildIncidentTriagePrompt({ title, description, address, skillsList });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: prompt }]
          }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
      }

      const resData = await response.json();
      const rawText = resData.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!rawText) {
        throw new Error("Empty response received from Gemini API");
      }

      return rawText;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Gemini API request timed out after ${this.timeoutMs}ms`);
      }
      throw err;
    }
  }
}

module.exports = GeminiProvider;
