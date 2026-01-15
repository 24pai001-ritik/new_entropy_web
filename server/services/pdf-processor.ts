const pdf = require('pdf-parse');

export interface PDFPage {
    pageNumber: number;
    text: string;
}

export class PDFProcessor {
    /**
     * Extracts text from a PDF buffer page by page.
     * Note: pdf-parse usually gives the whole text, but we can attempt to split or use metadata.
     */
    static async extractText(buffer: Buffer): Promise<string> {
        const data = await pdf(buffer);
        return data.text;
    }

    /**
     * Chunks text semantically (simplified for this RAG implementation).
     * We'll use a sliding window approach with decent overlap.
     */
    static chunkText(text: string, chunkSize: number = 700, overlap: number = 100): string[] {
        const chunks: string[] = [];
        const words = text.split(/\s+/);

        let start = 0;
        while (start < words.length) {
            const end = Math.min(start + chunkSize, words.length);
            const chunk = words.slice(start, end).join(' ');
            chunks.push(chunk);

            if (end === words.length) break;
            start += (chunkSize - overlap);
        }

        return chunks;
    }
}
