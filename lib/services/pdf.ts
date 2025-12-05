import pdf from 'pdf-parse';

export class PdfService {
  /**
   * Extracts text content from a PDF buffer.
   * @param buffer - The PDF file buffer.
   * @returns The extracted text content.
   */
  static async extractText(buffer: Buffer): Promise<string> {
    try {
      const data = await pdf(buffer);
      return data.text;
    } catch (error) {
      console.error('Error parsing PDF:', error);
      throw new Error('Failed to parse PDF content.');
    }
  }
}
