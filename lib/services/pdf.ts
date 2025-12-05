import PDFParser from 'pdf2json';

export class PdfService {
  /**
   * Extracts text content from a PDF buffer.
   * @param buffer - The PDF file buffer.
   * @returns The extracted text content.
   */
  static async extractText(buffer: Buffer): Promise<string> {
    return new Promise((resolve, reject) => {
      const pdfParser = new PDFParser(null, true); // true = Enable raw text parsing support

      pdfParser.on('pdfParser_dataError', (errData: any) => {
        console.error('PDF Parser Error:', errData.parserError);
        reject(new Error('Failed to parse PDF'));
      });

      pdfParser.on('pdfParser_dataReady', (pdfData: any) => {
        try {
          // pdfData is the raw JSON structure. We need to extract text from it.
          // The structure is roughly: formImage -> Pages -> Texts -> R -> T (URL encoded text)
          // However, calling `getRawTextContent()` on the parser instance is not directly possible here
          // because the event returns the data.
          
          // Fortunately, `pdf2json` has a mode to output text directly to a file, but here we want memory.
          // Let's iterate the JSON to build the string.
          
          const textContent = pdfParser.getRawTextContent();
          resolve(textContent);
        } catch (e) {
            reject(e);
        }
      });

      // Determine if we should use parseBuffer
      pdfParser.parseBuffer(buffer);
    });
  }
}