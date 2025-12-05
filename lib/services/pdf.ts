import PDFParser from "pdf2json";

export class PdfService {
	/**
	 * Extracts text content from a PDF buffer.
	 * @param buffer - The PDF file buffer.
	 * @returns The extracted text content.
	 */
	static async extractText(buffer: Buffer): Promise<string> {
		return new Promise((resolve, reject) => {
			const pdfParser = new PDFParser(null, true); // true = Enable raw text parsing support

			pdfParser.on("pdfParser_dataError", (errData: unknown) => {
				const message =
					typeof errData === "object" &&
					errData !== null &&
					"parserError" in errData
						? (errData as { parserError?: unknown }).parserError
						: errData;
				console.error("PDF Parser Error:", message);
				reject(new Error("Failed to parse PDF"));
			});

			pdfParser.on("pdfParser_dataReady", () => {
				try {
					const textContent = pdfParser.getRawTextContent();
					resolve(textContent);
				} catch (e) {
					reject(e);
				}
			});
			pdfParser.parseBuffer(buffer);
		});
	}
}
