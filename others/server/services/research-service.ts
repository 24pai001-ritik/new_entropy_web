import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import { PDFProcessor } from './pdf-processor';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const MODEL_NAME = "gemini-3-flash-preview";

export class ResearchService {

    // Helper for JSON extraction
    private static cleanJson(text: string): string {
        try {
            return text.replace(/```json/g, '').replace(/```/g, '').trim();
        } catch {
            return text;
        }
    }

    /**
     * CLAIM-EVIDENCE MAPPING
     * Maps key claims to specific evidence within the text.
     */
    static async analyzeClaims(text: string): Promise<any> {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            systemInstruction: "You are an expert Research Auditor.",
            generationConfig: {
                temperature: 1.0,
                responseMimeType: "application/json"
            }
        });

        const prompt = `
        Strictly based on the provided text, extract key claims and map them to their supporting evidence.
        
        Output format (JSON Array):
        [
            {
                "claim": "The core hypothesis or result claim",
                "evidence": "Specific experiment, table, or section citation supporting it",
                "confidence": "High/Medium/Low based on evidence strength",
                "quote": "Short direct quote if available"
            }
        ]

        Text to Analyze:
        ${text.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        return JSON.parse(this.cleanJson(result.response.text()));
    }

    /**
     * ASSUMPTION DETECTOR
     * Identifies explicit and implicit assumptions + Risk Analysis.
     */
    static async detectAssumptions(text: string): Promise<any> {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 1.0,
                responseMimeType: "application/json"
            }
        });

        const prompt = `
        Identify explicit and implicit assumptions in this research paper.
        For each, analyze the risk (What happens if this assumption fails?).

        Output format (JSON Array):
        [
            {
                "assumption": "Description of assumption",
                "type": "Explicit" or "Implicit",
                "risk_level": "Critical" | "High" | "Medium" | "Low",
                "impact_if_false": "Consequence if this assumption is wrong"
            }
        ]

        Text:
        ${text.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        return JSON.parse(this.cleanJson(result.response.text()));
    }

    /**
     * METHODOLOGY STRESS TEST
     * Critiques the robustness of the methods.
     */
    static async stressTestMethodology(methodsText: string): Promise<any> {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 1.0,
                responseMimeType: "application/json"
            }
        });

        const prompt = `
        Act as a hostile peer reviewer. Stress-test this methodology section.
        Look for: Missing baselines, Dataset bias, metric limitations, reproducibility risks.

        Output format (JSON Object):
        {
            "weaknesses": [
                {"point": "Weakness description", "severity": "Critical/Moderate", "reproducibility_risk": "High/Low"}
            ],
            "missing_elements": ["List of missing controls/baselines"],
            "verdict": "Robust / Flawed / Needs Clarification"
        }

        Methodology Text:
        ${methodsText.substring(0, 20000)}
        `;

        const result = await model.generateContent(prompt);
        return JSON.parse(this.cleanJson(result.response.text()));
    }

    /**
     * REVIEWER SIMULATION
     * Simulates 3 distinct reviewer personas.
     */
    static async simulateReviewer(text: string): Promise<any> {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 1.0,
                responseMimeType: "application/json"
            }
        });

        const prompt = `
        Simulate a top-tier conference review (e.g., CVPR, NeurIPS) with 3 reviewers.

        Reviewer A: Methodology-Focused (Strict on math/proofs)
        Reviewer B: Novelty & Impact (Does this matter?)
        Reviewer C: Clarity & Reproducibility (Can I build this?)

        Output format (JSON Object):
        {
            "reviewer_a": { "summary": "...", "strengths": [], "weaknesses": [], "questions": [], "score": "1-10", "decision": "Accept/Reject" },
            "reviewer_b": { ... },
            "reviewer_c": { ... }
        }

        Paper Text:
        ${text.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        return JSON.parse(this.cleanJson(result.response.text()));
    }

    /**
     * IDEA GENERATOR
     * Proposes grounded research extensions.
     */
    static async generateIdeas(text: string): Promise<any> {
        const model = genAI.getGenerativeModel({
            model: MODEL_NAME,
            generationConfig: {
                temperature: 1.0,
                responseMimeType: "application/json"
            }
        });

        const prompt = `
        Based strictly on the gaps and limitations of this text, generate 3 novel research ideas.
        
        Output format (JSON Array):
        [
            {
                "title": "Title of new research project",
                "derived_from_gap": "Which specific limitation in the text inspired this?",
                "proposed_method": "Brief technical approach",
                "expected_impact": "Why this matters"
            }
        ]

        Text:
        ${text.substring(0, 30000)}
        `;

        const result = await model.generateContent(prompt);
        return JSON.parse(this.cleanJson(result.response.text()));
    }
}
