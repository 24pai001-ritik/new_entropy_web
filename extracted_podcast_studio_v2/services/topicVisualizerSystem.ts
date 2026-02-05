
import { VisualizerMode } from "../types";

// Step 1: Define the Preset Structure
export interface TopicPresetStep {
    name: string;
    visualizer: Exclude<VisualizerMode, 'auto'>;
    hueShift: number;
    duration: number;
    intensity: number;
}

export type TopicPresets = Record<string, TopicPresetStep[]>;

// Step 2: Define the Presets Configuration
export const TOPIC_VISUAL_PRESETS: TopicPresets = {
    rl: [
        { name: "Gridworld State", visualizer: "drawRLGridworldVisualizer", hueShift: 200, duration: 8, intensity: 0.5 },
        { name: "Policy Flow", visualizer: "drawPolicyArrowsVisualizer", hueShift: 180, duration: 6, intensity: 0.6 },
        { name: "Q-Values Heatmap", visualizer: "drawQTableHeatmapVisualizer", hueShift: 0, duration: 7, intensity: 0.7 },
        { name: "Neural Approximator", visualizer: "drawNeuralNetworkGraphVisualizer", hueShift: 280, duration: 8, intensity: 0.8 },
        { name: "Agent Diagram", visualizer: "drawRobotOutlineVisualizer", hueShift: 40, duration: 5, intensity: 0.4 },
        { name: "State Transitions", visualizer: "drawStateTransitionGraphVisualizer", hueShift: 160, duration: 6, intensity: 0.6 }
    ],
    ai: [
        { name: "Brain Network", visualizer: "drawBrainNetworkVisualizer", hueShift: 260, duration: 8, intensity: 0.7 },
        { name: "Neural Pathways", visualizer: "neuralNet", hueShift: 200, duration: 7, intensity: 0.6 },
        { name: "Deep Geometry", visualizer: "geometric", hueShift: 180, duration: 6, intensity: 0.5 },
        { name: "Genetic Code", visualizer: "dna", hueShift: 300, duration: 8, intensity: 0.6 },
        { name: "Abstract Thought", visualizer: "plasma", hueShift: 240, duration: 7, intensity: 0.4 }
    ],
    aiNews: [
        { name: "Radar Sweep", visualizer: "newsRadar", hueShift: 10, duration: 5, intensity: 0.8 },
        { name: "Data Stream", visualizer: "matrix", hueShift: 120, duration: 6, intensity: 0.7 },
        { name: "Global Pulse", visualizer: "galaxy", hueShift: 220, duration: 7, intensity: 0.6 },
        { name: "Info Bars", visualizer: "bars", hueShift: 40, duration: 4, intensity: 0.9 },
        { name: "Hex Network", visualizer: "hexGrid", hueShift: 200, duration: 6, intensity: 0.6 }
    ],
    nlp: [
        { name: "Token Lattice", visualizer: "drawTokenLatticeVisualizer", hueShift: 280, duration: 8, intensity: 0.7 },
        { name: "Attention Matrix", visualizer: "drawAttentionMatrixVisualizer", hueShift: 320, duration: 7, intensity: 0.8 },
        { name: "Word Strings", visualizer: "string", hueShift: 180, duration: 6, intensity: 0.5 },
        { name: "Vector Space", visualizer: "particles", hueShift: 200, duration: 6, intensity: 0.6 }
    ],
    aiAgents: [
        { name: "Swarm Intelligence", visualizer: "drawAgentSwarmVisualizer", hueShift: 160, duration: 8, intensity: 0.7 },
        { name: "Agent Identity", visualizer: "drawRobotOutlineVisualizer", hueShift: 40, duration: 5, intensity: 0.6 },
        { name: "Environment Mesh", visualizer: "hexGrid", hueShift: 120, duration: 7, intensity: 0.5 },
        { name: "Communication Lines", visualizer: "neuralNet", hueShift: 180, duration: 6, intensity: 0.6 }
    ],
    funFacts: [
        { name: "Bouncing Blobs", visualizer: "drawBouncingBlobsVisualizer", hueShift: 50, duration: 6, intensity: 0.8 },
        { name: "Blooming Knowledge", visualizer: "flower", hueShift: 300, duration: 7, intensity: 0.5 },
        { name: "Kaleidoscope", visualizer: "kaleidoscope", hueShift: 0, duration: 8, intensity: 0.9 },
        { name: "Digital Rain", visualizer: "digitalRain", hueShift: 120, duration: 5, intensity: 0.7 }
    ],
    custom: [] // Placeholder for runtime additions
};

// Step 3: Logic Functions

/**
 * Detects the best topic key based on input string.
 */
export const detectTopic = (topic: string): string => {
    const t = topic.toLowerCase();
    
    if (t.includes('reinforcement') || t.includes('rl') || t.includes('policy') || t.includes('q-learning')) return 'rl';
    if (t.includes('news') || t.includes('update') || t.includes('flash') || t.includes('report')) return 'aiNews';
    if (t.includes('nlp') || t.includes('language') || t.includes('text') || t.includes('gpt') || t.includes('llm') || t.includes('transformer')) return 'nlp';
    if (t.includes('agent') || t.includes('autonomous') || t.includes('swarm') || t.includes('robot')) return 'aiAgents';
    if (t.includes('fun') || t.includes('fact') || t.includes('did you know') || t.includes('trivia')) return 'funFacts';
    
    // Check if custom topic exists and matches name
    const customKeys = Object.keys(TOPIC_VISUAL_PRESETS).filter(k => k.startsWith('custom_'));
    for (const key of customKeys) {
        // Strip prefix "custom_" to compare name
        const name = key.replace('custom_', '');
        if (t.includes(name)) return key;
    }

    return 'ai'; // Default Fallback
};

/**
 * Adds a custom topic preset at runtime.
 */
export const addCustomTopic = (name: string, config: {
    hueShift: number,
    visuals: string[], // Array of visualizer function names (strings)
    duration: number
}) => {
    const key = `custom_${name.toLowerCase()}`;
    
    // Map string names to valid TopicPresetSteps
    const steps: TopicPresetStep[] = config.visuals.map(vName => ({
        name: `${name} - ${vName}`,
        visualizer: vName as Exclude<VisualizerMode, 'auto'>, // User must provide valid names
        hueShift: config.hueShift,
        duration: config.duration,
        intensity: 0.7
    }));
    
    TOPIC_VISUAL_PRESETS[key] = steps;
};

/**
 * Calculates the current active visualizer state based on topic and time.
 * This ensures deterministic rendering for video export.
 */
export const getTopicVisualizerState = (topicString: string, currentTime: number): { visualizer: Exclude<VisualizerMode, 'auto'>, hueShift: number } => {
    const topicKey = detectTopic(topicString);
    const presets = TOPIC_VISUAL_PRESETS[topicKey] || TOPIC_VISUAL_PRESETS['ai'];
    
    if (presets.length === 0) return { visualizer: 'circle', hueShift: 0 };

    let runningDuration = 0;
    const totalCycleDuration = presets.reduce((acc, p) => acc + p.duration, 0);
    const loopTime = currentTime % totalCycleDuration;

    let activePreset = presets[0];

    for (const preset of presets) {
        if (loopTime >= runningDuration && loopTime < runningDuration + preset.duration) {
            activePreset = preset;
            break;
        }
        runningDuration += preset.duration;
    }

    return {
        visualizer: activePreset.visualizer,
        hueShift: activePreset.hueShift
    };
};
