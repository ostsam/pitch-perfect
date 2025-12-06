import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface PitchEvaluationInput {
  transcript: string;
  emotionData: string; // e.g., "Dominant: Fear (80%), Secondary: Sad (10%)"
  pageText?: string;
  deckSummary?: string;
  pdfContext?: string; // deprecated fallback
  previousRoasts?: string[];
}

export interface PitchEvaluationResult {
  shouldInterrupt: boolean;
  roastMessage: string | null;
}

export interface SummaryResult {
  summary: string;
  sections: { title: string; startPage: number; endPage: number }[];
}

export class IntelligenceService {
  static async summarizeDeck(pages: string[]): Promise<SummaryResult> {
    const formattedPages = pages
      .map((text, i) => `Page ${i + 1}:\n${text.slice(0, 1000)}`)
      .join("\n\n");

    const prompt = `
      You are an expert pitch deck analyst.
      Analyze the provided pitch deck content (organized by page number).
      
      Tasks:
      1. Create a concise, professional summary (max 200 words) covering: Problem, Solution, Market, Business Model, Traction, Team, and Ask.
      2. Segment the deck into logical sections (e.g., "Problem", "Solution", "Market", "Financials").
      
      Return a JSON object with this structure:
      {
        "summary": "string",
        "sections": [
          { "title": "string", "startPage": number, "endPage": number }
        ]
      }
      
      Rules:
      - 'startPage' and 'endPage' must correspond to the provided Page numbers.
      - Ensure every page is covered in a section.
      - Section titles should be standard pitch deck categories where possible.
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: formattedPages },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      });

      const content = completion.choices[0].message.content || "{}";
      const parsed = JSON.parse(content);
      return {
        summary: parsed.summary || "",
        sections: parsed.sections || [],
      };
    } catch (error) {
      console.error("Error summarizing deck:", error);
      return { summary: pages.join(" ").slice(0, 1200), sections: [] };
    }
  }

  /**
   * Analyzes the pitch state and decides whether to interrupt.
   */
  static async evaluatePitch(
    input: PitchEvaluationInput,
  ): Promise<PitchEvaluationResult> {
    const {
      transcript,
      emotionData,
      pageText = "",
      deckSummary = "",
      pdfContext = "",
      previousRoasts = [],
    } = input;

    if (
      transcript.length < 10 &&
      !emotionData.includes("Fear") &&
      !emotionData.includes("Sad")
    ) {
      return { shouldInterrupt: false, roastMessage: null };
    }

    const systemPrompt = `
		      You are a ruthless, sarcastic, and highly observant venture capitalist pitch coach.
		      Your goal is to help the user improve by interrupting them when they are doing a poor job.
		      
		      You have access to:
		      1. The content of their Pitch Deck (Context).
		      2. What they just said (Transcript).
		      3. Their facial expression analysis (Emotions).
		
		            NOTE: The transcript is a REAL-TIME STREAM. 
		            - Sentences might appear cut off if the user is mid-thought. 
		            - Do NOT interrupt solely for a "partial sentence" unless it is followed by significant silence (implied by the fact that you are being called) or stuttering.
		            - Focus on CONTENT contradictions, negative EMOTIONS, and incoherent RAMBLING.
		            - RESTARTING: If the user repeats information (especially from the start of the page), assume they are RESTARTING after an interruption. Do NOT roast them for "repeating themselves" or "saying that already". Judge the NEW delivery.
		      
		      CRITERIA FOR INTERRUPTION:		      
          - Contradicting the Pitch Deck facts.
		      - Visibly nervous, scared, or sad (Fear/Sad > 50%).
		      - Stuttering, repeated filler words (um, uh), or actual incoherent rambling (not just a pause).
		      - Being boring or low energy.
		      
		      INSTRUCTIONS:
		      - Analyze the inputs.
		      - Decide if an interruption is WARRANTED. Do not interrupt if they are doing "okay" or just pausing for breath.
		      - If warranted, generate a short, biting, direct "roast" (1-2 sentences max) directly in response to the relevant chunk.
		      - Be mean but constructive. Like Simon Cowell meets Gordon Ramsay.
		      - Format the roast text itself wrapped with tone markers: prefix with [angry] or [screaming].
		      - Example: "[angry] That was awful [screaming] You're a complete failure!"
		      - If not warranted, return shouldInterrupt: false.
		
		      Output JSON format:
		      {
		        "shouldInterrupt": boolean,
		        "roastMessage": string | null // The text to speak if interrupting
		      }
		    `;
    const userPrompt = `
      PITCH DECK CONTEXT (current page first, then brief summary):
      CURRENT PAGE:
      ${pageText || "(no page text available)"}

      DECK SUMMARY (short):
      ${deckSummary || pdfContext || "(no deck summary available)"}

      USER EMOTIONS:
      ${emotionData}

      USER TRANSCRIPT (Last few seconds):
      "${transcript}"

      PREVIOUS ROASTS (Do not repeat):
      ${previousRoasts.join(" | ")}
    `;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.4,
      });

      const content = completion.choices[0].message.content;
      if (!content) throw new Error("No content from OpenAI");

      const result = JSON.parse(content) as PitchEvaluationResult;
      return result;
    } catch (error) {
      console.error("Error in IntelligenceService:", error);
      // Fail gracefully - don't interrupt if brain breaks
      return { shouldInterrupt: false, roastMessage: null };
    }
  }
}
