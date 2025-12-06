import { NextRequest, NextResponse } from "next/server";
import { VoiceService } from "@/lib/services/elevenlabs";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    const audioStream = await VoiceService.streamAudio(text);

    // Return the stream directly with correct headers
    return new NextResponse(audioStream, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Error generating speech:", error);
    return NextResponse.json(
      { error: "Failed to generate speech" },
      { status: 500 },
    );
  }
}
