import PDFParser from "pdf2json";

export class PdfService {
  /**
   * Extracts text content from a PDF buffer.
   * @param buffer - The PDF file buffer.
   * @returns The extracted text content.
   */
  static async extractText(
    buffer: Buffer,
  ): Promise<{ fullText: string; pages: string[] }> {
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

      pdfParser.on("pdfParser_dataReady", (pdfData: unknown) => {
        try {
          const fullText = pdfParser.getRawTextContent();

          // Extract per-page text from pdfData if possible
          let pages: string[] = [];
          if (
            typeof pdfData === "object" &&
            pdfData !== null &&
            "formImage" in pdfData &&
            typeof (pdfData as { formImage?: unknown }).formImage === "object"
          ) {
            const formImage = (pdfData as { formImage?: unknown }).formImage;
            if (
              formImage &&
              typeof formImage === "object" &&
              "Pages" in formImage &&
              Array.isArray((formImage as { Pages?: unknown }).Pages)
            ) {
              pages = ((formImage as { Pages: unknown[] }).Pages || []).map(
                (page: unknown) => {
                  if (
                    page &&
                    typeof page === "object" &&
                    "Texts" in page &&
                    Array.isArray((page as { Texts?: unknown }).Texts)
                  ) {
                    const texts = (page as { Texts: unknown[] }).Texts || [];
                    const pageText = texts
                      .map((t: unknown) => {
                        if (
                          t &&
                          typeof t === "object" &&
                          "R" in t &&
                          Array.isArray((t as { R?: unknown }).R)
                        ) {
                          const runs = (t as { R: unknown[] }).R;
                          return runs
                            .map((r: unknown) => {
                              if (
                                r &&
                                typeof r === "object" &&
                                "T" in r &&
                                typeof (r as { T?: unknown }).T === "string"
                              ) {
                                return decodeURIComponent(
                                  (r as { T: string }).T,
                                );
                              }
                              return "";
                            })
                            .join(" ");
                        }
                        return "";
                      })
                      .join(" ");
                    return pageText;
                  }
                  return "";
                },
              );
            }
          }

          resolve({ fullText, pages });
        } catch (e) {
          reject(e);
        }
      });
      pdfParser.parseBuffer(buffer);
    });
  }
}
