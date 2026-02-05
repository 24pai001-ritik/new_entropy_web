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

    /**
     * Detects and extracts standard research paper sections.
     */
    static detectSections(text: string): Record<string, string> {
        const SECTION_KEYS = [
            "abstract", "introduction", "background", "related work", "methodology", "methods",
            "experiments", "results", "analysis", "discussion", "conclusion", "limitations", "future work", "references"
        ];

        // Regex to capture section headers (case-insensitive, multiline start)
        // Matches lines starting with the section name
        const matches: { index: number, title: string }[] = [];

        SECTION_KEYS.forEach(key => {
            const regex = new RegExp(`^\\s*(${key})\\b.*$`, 'gim');
            let match;
            while ((match = regex.exec(text)) !== null) {
                matches.push({ index: match.index, title: key });
            }
        });

        if (matches.length === 0) {
            return { "full_text": text };
        }

        // Sort matches by position
        matches.sort((a, b) => a.index - b.index);

        // Add start and end boundaries
        const points = [
            { index: 0, title: "_start" },
            ...matches,
            { index: text.length, title: "_end" }
        ];

        // Unique logic to avoid duplicates if regex matches multiple times (simple de-dupe by title presence?)
        // Actually, we want to capture the logical flow. 
        // Let's just iterate and slice.
        const sections: Record<string, string> = {};

        for (let i = 0; i < points.length - 1; i++) {
            const current = points[i];
            const next = points[i + 1];

            // Skip the implied start if it's not a real section, 
            // but capturing Pre-Introduction text as "preamble" can be useful.
            const title = current.title === "_start" ? "preamble" : current.title;
            const content = text.slice(current.index, next.index).trim();

            if (content.length > 50) { // arbitrary noise filter
                // If section exists, append (some papers split Results...)
                if (sections[title]) {
                    sections[title] += "\n\n" + content;
                } else {
                    sections[title] = content;
                }
            }
        }

        return sections;
    }
}
