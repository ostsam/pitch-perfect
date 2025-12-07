import { NextRequest, NextResponse } from "next/server";
import {
  IntelligenceService,
  PitchEvaluationInput,
} from "@/lib/services/openai";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transcript,
      emotionData,
      pageText,
      deckSummary,
      pdfContext,
      previousRoasts,
    } = body as PitchEvaluationInput;

    if (!pageText && !deckSummary && !pdfContext) {
      return NextResponse.json(
        { error: "PDF context is required" },
        { status: 400 }
      );
    }

    const result = await IntelligenceService.evaluatePitch({
      transcript,
      emotionData,
      pageText,
      deckSummary,
      pdfContext,
      previousRoasts,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error analyzing pitch:", error);
    return NextResponse.json(
      { error: "Failed to analyze pitch" },
      { status: 500 }
    );
  }
}
