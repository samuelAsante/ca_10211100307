import Groq from "groq-sdk";
import { UserEvent, AIAnalysis } from "../interfaces/analytics";
import { aiCircuitBreaker } from "../lib/circuit-breaker";

let groqClient: Groq | null = null;

function getGroqClient(): Groq {
  if (!process.env.GROQ_API_KEY?.trim()) {
    throw new Error("GROQ_API_KEY not configured");
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 25_000,
      maxRetries: 1,
    });
  }

  return groqClient;
}

function parseAnalysisJson(content: string): {
  summary: string;
  confidence: number;
  patterns: string[];
} {
  const trimmed = content.trim();
  const candidates = [trimmed];
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) candidates.push(fenced[1].trim());
  const objectMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objectMatch) candidates.push(objectMatch[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      return {
        summary: String(parsed.summary || "No summary returned"),
        confidence: Number(parsed.confidence) || 0,
        patterns: Array.isArray(parsed.patterns)
          ? parsed.patterns.map(String)
          : [],
      };
    } catch {
      // try next candidate
    }
  }

  throw new Error("AI returned invalid JSON");
}

/**
 * Analyze batch of user events with AI
 * Wrapped with circuit breaker to protect against cascading failures
 */
export async function analyzeEventBatch(
  events: UserEvent[],
): Promise<AIAnalysis> {
  if (events.length === 0) {
    throw new Error("No events to analyze");
  }

  const groq = getGroqClient();

  return aiCircuitBreaker.execute(async () => {
    return performAnalysis(events, groq);
  });
}

async function performAnalysis(
  events: UserEvent[],
  groq: Groq,
): Promise<AIAnalysis> {
  const eventSummary = events.map((e) => ({
    type: e.eventType,
    page: e.page,
    timestamp: e.timestamp,
    metadata: e.metadata,
  }));

  const prompt = `
You are analyzing user behavior on an e-commerce website.
Below is a batch of ${events.length} user events from the last time window.

Events:
${JSON.stringify(eventSummary, null, 2)}

Analyze these events and provide a JSON response with the following structure:
{
  "summary": "concise 1-2 sentence summary of user behavior patterns",
  "confidence": 0.85,
  "patterns": ["pattern1", "pattern2"]
}

You MUST respond with ONLY valid JSON, no markdown, no backticks, no additional text.
`;

  try {
    const completion = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content:
            "You are a behavioral analytics expert analyzing e-commerce user events.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response from AI");
    }

    const result = parseAnalysisJson(content);

    return {
      summary: result.summary,
      confidence: result.confidence,
      patterns: result.patterns,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error("AI analysis failed:", error);
    throw error;
  }
}
