import { NextResponse } from "next/server";
import { DeepgramService } from "@/lib/services/deepgram";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const key = await DeepgramService.getEphemeralKey();
    return NextResponse.json(key);
  } catch (error) {
    console.error("Error getting Deepgram token:", error);
    return NextResponse.json(
      { error: "Failed to generate credentials" },
      { status: 500 },
    );
  }
}
