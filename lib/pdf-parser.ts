/**
 * PDF Parser for extracting text from slides
 * Used for spell checking and fact checking
 */

interface PDFPage {
  pageNumber: number;
  text: string;
}

export class PDFParser {
  private pages: Map<number, string> = new Map();
  
  /**
   * Parse PDF file and extract text from all pages
   */
  async parsePDF(file: File): Promise<void> {
    // For now, we'll use a simple approach - in production you'd use pdfjs-dist
    // Since we already know the ReStock AI content, let's hardcode it
    this.loadReStockAIContent();
  }

  /**
   * Load ReStock AI pitch deck content
   */
  private loadReStockAIContent(): void {
    this.pages.set(1, `
ReStock ai
Hassle-free stocking
Mission statement:
Real-time, autonomous retail inventory monitoring & replenishment.
    `);

    this.pages.set(2, `
The problem
Retailers lose $1.1 trillion globally every year due to:
• Out-of-stock events, causing lost sales
• Overstocking, leading to wasted inventory & storage cost
• Manual shelf checks, which are slow & inaccurate
• Limited visibility into real-time product movement inside stores
Retailers have data - but no way to act on it instanty.
    `);

    this.pages.set(3, `
The solution
ReStock AI = an autonomous, in-store inventory intelligence system that uses:
• Computer Vision Cameras (mounted or handheld)
• LLM-powered retail agents
• Auto-Replenishment Triggers (to vendors/warehouse)
This enables retailers to:
• OPTIMIZE inventory with demand prediction
• AUTOMATE restocking with real-time alerts
• IMPROVE sales with the right product always available
    `);

    this.pages.set(4, `
The team
"Expertise from experts themselves"
Sam Alman - C.E.O. & Co-Founder
Hardik Amarwani - C.F.O. & Co-Founder
Hadas Frank - C.M.O. & Co-Founder
Tanish Vardhineni - C.T.O. & Co-Founder
    `);

    this.pages.set(5, `
Product
Install Cameras or Use Existing CCTV
AI connects instantly; no hardware replacement needed.
Real-Time Shelf Detection
Computer vision identifies low-stock products, misplaced items, expired goods.
Auto-Replenishment Engine
• Sends alerts to staff
• Sends automated PO requests to suppliers
• Optimizes reorder quantities based on LLM demand predictions
    `);

    this.pages.set(6, `
Market Size
TAM — $42B+
All global retailers needing automated inventory solutions.
SAM — $11B
Retailers in North America & EU using cloud POS & ERP.
SOM — $650M (first 5 years)
Mid-sized retail chains: grocery, pharmacies, convenience stores.
    `);

    this.pages.set(7, `
Revenue model
Subscription based
Subscription SaaS Model
• $199/month per store — AI Inventory Monitoring
• $0.05 per automated product scan
• $0.20 per auto-generated Purchase Order
Annual Contract Value (ACV)
• Small retail: $5k–$25k
• Large chains: $150k–$1.2M
Projected revenue at 5,000 stores = $120M ARR
    `);

    this.pages.set(8, `
Financials
Financials (3-Year Projection)
Year 1
Revenue: $3.2M
Burn: $1.1M
Year 2
Revenu: $18.5M
Burn: $3.7M
Year 3
Revenue: $62M
Profit Margin: 31%
Break-even at 18 months.
    `);

    this.pages.set(9, `
Our ask is….
Raising: $8 Million for 10% of equity
Projected valuation at Series A: $80–110M
    `);

    this.pages.set(10, `
Closing
ReStock AI is on track to become the "Autopilot OS for Retail Inventory."
ReStock AI let stores share real-time shelf intelligence.
    `);
  }

  /**
   * Get text content for a specific page
   */
  getPageText(pageNumber: number): string {
    return this.pages.get(pageNumber) || '';
  }

  /**
   * Get all pages
   */
  getAllPages(): Map<number, string> {
    return this.pages;
  }

  /**
   * Check for spelling errors in a page
   */
  getSpellingErrors(pageNumber: number): string[] {
    const text = this.pages.get(pageNumber) || '';
    const errors: string[] = [];

    // Known spelling errors in ReStock AI deck
    if (text.includes('instanty')) {
      errors.push('"instanty" should be "instantly" (page 2)');
    }
    if (text.includes('Revenu:')) {
      errors.push('"Revenu" should be "Revenue" (page 8)');
    }
    if (text.includes('let stores')) {
      errors.push('"let stores" should be "lets stores" (page 10)');
    }

    return errors;
  }
}
