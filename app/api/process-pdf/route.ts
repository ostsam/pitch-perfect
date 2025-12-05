import { NextRequest, NextResponse } from 'next/server';
import { PdfService } from '@/lib/services/pdf';
import { IntelligenceService } from '@/lib/services/openai';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'File must be a PDF' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { fullText, pages } = await PdfService.extractText(buffer);
    const summary = await IntelligenceService.summarizeDeck(fullText);

    return NextResponse.json({ text: fullText, pages, summary });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json(
      { error: 'Failed to process PDF' },
      { status: 500 }
    );
  }
}
