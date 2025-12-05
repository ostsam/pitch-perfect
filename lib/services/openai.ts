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

export class IntelligenceService {
	static async summarizeDeck(text: string): Promise<string> {
		const prompt = `
      Summarize this pitch deck text into concise bullets (max 200 words).
      Focus on: problem, solution, market, traction, business model, team, ask.
      Keep it compact and factual.
    `;

		try {
			const completion = await openai.chat.completions.create({
				model: "gpt-4.1-mini",
				messages: [
					{ role: "system", content: prompt },
					{ role: "user", content: text.slice(0, 12000) },
				],
				max_tokens: 400,
				temperature: 0.4,
			});

			const summary = completion.choices[0].message.content || "";
			return summary.trim();
		} catch (error) {
			console.error("Error summarizing deck:", error);
			return text.slice(0, 1200);
		}
	}

	/**
	 * Analyzes the pitch state and decides whether to interrupt.
	 */
	static async evaluatePitch(
		input: PitchEvaluationInput
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

      CRITERIA FOR INTERRUPTION:
      - Contradicting the Pitch Deck facts.
      - Visibly nervous, scared, or sad (Fear/Sad > 50%).
      - Stuttering, filler words (um, uh), or incoherent rambling.
      - Being boring or low energy.
      
      INSTRUCTIONS:
      - Analyze the inputs.
      - Decide if an interruption is WARRANTED. Do not interrupt if they are doing "okay".
      - If warranted, generate a short, biting, direct "roast" (1-2 sentences max) directly in response to the relevant chunk.
      - Be mean but constructive. Like Simon Cowell meets Gordon Ramsay.
      - Format the roast text itself wrapped with tone markers: prefix with <angry> or <screaming> and suffix with </angry> or </screaming> at appropriate intervals.
      - Example: "<angry> That was awful </angry> <screaming> You're a complete failure! </screaming>"
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
				model: "gpt-4.1-mini",
				messages: [
					{ role: "system", content: systemPrompt },
					{ role: "user", content: userPrompt },
				],
				response_format: { type: "json_object" },
				temperature: 0.8,
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
