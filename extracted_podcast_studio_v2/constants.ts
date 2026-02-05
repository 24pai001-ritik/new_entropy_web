
import { VisualizerPreset } from "./types";

export const TONES = [
  "Informative",
  "Casual",
  "Humorous",
  "Debate",
  "Storytelling",
  "Professional",
  "Dramatic",
  "Empathetic"
];

export const LANGUAGES = [
  "English",
  "Spanish",
  "French",
  "German",
  "Portuguese",
  "Hindi",
  "Hinglish"
];

export const SCRIPT_FORMATS = [
    { id: 'devanagari', label: 'Devanagari (Native)', desc: 'नमस्ते, आप कैसे हैं?' },
    { id: 'roman', label: 'Roman (Latin)', desc: 'Namaste, aap kaise hain?' }
];

export const TARGET_AUDIENCES = [
  "General Public",
  "Professionals/Experts",
  "Students",
  "Children (5-10)",
  "Teenagers",
  "Seniors",
  "Tech Enthusiasts",
  "Entrepreneurs"
];

export const ASPECT_RATIOS = [
  "16:9",
  "9:16",
  "1:1",
  "4:3",
  "3:4"
];

export interface VoiceOption {
    id: string; // Unique Preset ID
    apiId: string; // Actual Gemini Voice Name
    label: string;
    gender: string;
    age: string;
    accent: string;
    desc: string;
}

export const VOICE_OPTIONS: VoiceOption[] = [
  { 
    id: 'Puck', 
    apiId: 'Puck',
    label: 'The Professor', 
    gender: 'Male', 
    age: 'Middle-Aged', 
    accent: 'British / Transatlantic', 
    desc: 'Articulate, witty, slightly formal' 
  },
  { 
    id: 'Charon', 
    apiId: 'Charon',
    label: 'The Veteran', 
    gender: 'Male', 
    age: 'Senior', 
    accent: 'Deep American', 
    desc: 'Gravitas, slow-paced, authoritative' 
  },
  { 
    id: 'Fenrir', 
    apiId: 'Fenrir',
    label: 'Radio Host', 
    gender: 'Male', 
    age: 'Young Adult', 
    accent: 'American (Fast)', 
    desc: 'High energy, gritty, confident' 
  },
  { 
    id: 'Kore', 
    apiId: 'Kore',
    label: 'Wellness Coach', 
    gender: 'Female', 
    age: 'Young Adult', 
    accent: 'Soft American', 
    desc: 'Calm, soothing, therapeutic' 
  },
  { 
    id: 'Aoede', 
    apiId: 'Aoede',
    label: 'News Anchor', 
    gender: 'Female', 
    age: 'Middle-Aged', 
    accent: 'American (Standard)', 
    desc: 'Polished, clear, objective' 
  },
  { 
    id: 'Zephyr', 
    apiId: 'Zephyr',
    label: 'The Influencer', 
    gender: 'Female', 
    age: 'Gen-Z', 
    accent: 'Modern American', 
    desc: 'Excited, vocal fry, trendy slang' 
  },
  // --- NEW OPTIONS ---
  { 
    id: 'Puck_Indian', 
    apiId: 'Puck', // Using Puck for its crisp articulation
    label: 'The Tech Lead', 
    gender: 'Male', 
    age: 'Young Adult', 
    accent: 'Indian English', 
    desc: 'Precise, technical, fast-paced' 
  },
  { 
    id: 'Aoede_Indian', 
    apiId: 'Aoede', // Using Aoede for clarity
    label: 'The Insight', 
    gender: 'Female', 
    age: 'Young Adult', 
    accent: 'Indian / Global', 
    desc: 'Warm, explanatory, rhythmic' 
  },
  { 
    id: 'Fenrir_Euro', 
    apiId: 'Fenrir', 
    label: 'The Futurist', 
    gender: 'Male', 
    age: '30s', 
    accent: 'European / International', 
    desc: 'Direct, innovative, intense' 
  }
];

export const CONTENT_FORMATS = [
    { id: 'podcast', label: 'Podcast', desc: 'Conversation / Interview', icon: 'Mic' },
    { id: 'news', label: 'News Anchor', desc: 'Formal broadcast style', icon: 'Tv' },
    { id: 'reels', label: 'Viral Reel', desc: 'Fast-paced, hook-heavy', icon: 'Smartphone' },
    { id: 'research', label: 'Research', desc: 'Academic explainer', icon: 'BookOpen' }
];

export const DEFAULT_HOSTS = [
    { id: 'A', name: 'Alex', voiceId: 'Charon' },
    { id: 'B', name: 'Jamie', voiceId: 'Aoede' },
    { id: 'C', name: 'Sam', voiceId: 'Puck' },
    { id: 'D', name: 'Taylor', voiceId: 'Zephyr' }
];

// --- VISUALIZER CATEGORIES ---

export interface VisualizerCategory {
    id: string;
    label: string;
    description: string;
}

export const VISUALIZER_CATEGORIES: VisualizerCategory[] = [
    {
        id: 'core',
        label: 'Core Audio Visualizers',
        description: 'Waveforms, bars, circles, particles, matrix lines, kaleidoscope patterns, ripples, geometric shapes.'
    },
    {
        id: 'ai',
        label: 'AI / Machine Learning',
        description: 'Neural networks, brain-like node clusters, DNA structures, activation patterns, ML-inspired graphs.'
    },
    {
        id: 'nlp',
        label: 'NLP / Transformer',
        description: 'Attention matrices, token grids, activation lattices, transformer-style blocks and scanning patterns.'
    },
    {
        id: 'rl',
        label: 'RL Sketch Visualizers',
        description: 'Hand-drawn style gridworlds, Q-tables, policy arrows, state graphs, robot outlines, transition diagrams.'
    },
    {
        id: 'agents',
        label: 'AI Agents & Swarms',
        description: 'Agent swarms, autonomous triangles, vision cones, dynamic movement patterns, robot representations.'
    },
    {
        id: 'fun',
        label: 'Fun / Character',
        description: 'Animated faces, bouncing blobs, playful elements, cute or expressive character-style visuals.'
    },
    {
        id: 'aesthetic',
        label: 'Aesthetic / Scene',
        description: 'Landscapes, mountains, cosmic spirals, galaxies, floral or atmospheric designs reacting to sound.'
    },
    {
        id: 'news',
        label: 'AI News / Tech',
        description: 'Radar sweeps, digital rain, matrix grids, tech-styled UI elements suitable for news commentary.'
    }
];

// --- VISUAL PRESET SYSTEM ---

export const VISUAL_PRESETS: Record<string, VisualizerPreset[]> = {
  podcast: [
    { name: "Soft Glow Waves", visualizer: "wave", hueShift: 200, duration: 8 },
    { name: "Warm Circles", visualizer: "circle", hueShift: 30, duration: 6 },
    { name: "Gentle Ripples", visualizer: "ripple", hueShift: 240, duration: 7 },
    { name: "Minimal Bars", visualizer: "bars", hueShift: 0, duration: 6 },
    { name: "Blooming Ideas", visualizer: "flower", hueShift: 280, duration: 8 },
    { name: "Calm Landscape", visualizer: "landscape", hueShift: 200, duration: 10 },
    { name: "Smooth Plasma", visualizer: "plasma", hueShift: 260, duration: 7 },
    { name: "Focus Orb", visualizer: "orb", hueShift: 40, duration: 6 }
  ],
  news: [
    { name: "Tech Radar Sweep", visualizer: "newsRadar", hueShift: 10, duration: 5 },
    { name: "Data Matrix", visualizer: "matrix", hueShift: 120, duration: 4 },
    { name: "Breaking Flash", visualizer: "particles", hueShift: 0, duration: 3 },
    { name: "Global Network", visualizer: "neuralNet", hueShift: 200, duration: 6 },
    { name: "Information Grid", visualizer: "hexGrid", hueShift: 220, duration: 5 },
    { name: "Ticker Bars", visualizer: "bars", hueShift: 40, duration: 4 },
    { name: "Digital Stream", visualizer: "digitalRain", hueShift: 120, duration: 5 },
    { name: "Analytic Geo", visualizer: "geometric", hueShift: 180, duration: 5 }
  ],
  research: [
    { name: "DNA Twist", visualizer: "dna", hueShift: 280, duration: 6 },
    { name: "Neural Pulse", visualizer: "neuralNet", hueShift: 180, duration: 6 },
    { name: "String Theory", visualizer: "string", hueShift: 300, duration: 5 },
    { name: "Cosmic Scale", visualizer: "galaxy", hueShift: 240, duration: 8 },
    { name: "Quantum Particles", visualizer: "particles", hueShift: 160, duration: 5 },
    { name: "Structure Grid", visualizer: "hexGrid", hueShift: 200, duration: 6 },
    { name: "Logic Geometry", visualizer: "geometric", hueShift: 140, duration: 5 },
    { name: "Data Ripple", visualizer: "ripple", hueShift: 210, duration: 5 }
  ],
  reels: [
    { name: "Hype Sparks", visualizer: "particles", hueShift: 50, duration: 3 },
    { name: "Neon Kaleido", visualizer: "kaleidoscope", hueShift: 300, duration: 4 },
    { name: "Bass Face", visualizer: "face", hueShift: 0, duration: 4 },
    { name: "Fast Wave Blast", visualizer: "wave", hueShift: 20, duration: 2 },
    { name: "Glitch Rain", visualizer: "digitalRain", hueShift: 280, duration: 3 },
    { name: "Power Orb", visualizer: "orb", hueShift: 40, duration: 2 },
    { name: "Hyper Hex", visualizer: "hexGrid", hueShift: 120, duration: 3 },
    { name: "Vibe Circle", visualizer: "circle", hueShift: 320, duration: 3 }
  ]
};
