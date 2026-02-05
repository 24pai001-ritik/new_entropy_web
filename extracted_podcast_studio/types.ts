
export enum AppState {
  IDLE = 'IDLE',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  OUTLINE_REVIEW = 'OUTLINE_REVIEW',
  GENERATING_SCRIPT = 'GENERATING_SCRIPT',
  SCRIPT_REVIEW = 'SCRIPT_REVIEW', // New Step
  GENERATING_MEDIA = 'GENERATING_MEDIA', // Combined Audio + Image generation state
  PLAYING = 'PLAYING',
  ERROR = 'ERROR'
}

export type ContentFormat = 'podcast' | 'news' | 'reels' | 'research';

export interface HostConfig {
  id: string;
  name: string;
  voiceId: string;
  customTraits?: string; // Optional user-defined personality
}

export type YoutubeAnalysisMode = 'deep_dive' | 'debate' | 'reaction' | 'educational' | 'summary';

export interface PodcastSettings {
  topic: string;
  tone: string;
  duration: string;
  language: string;
  scriptFormat: 'devanagari' | 'roman';
  targetAudience: string;
  aspectRatio: string;
  logo: string | null; // Base64 Data URL for optional branding
  firstImage: string | null; // Base64 for hook
  lastImage: string | null; // Base64 for closure
  brandColors: {
    primary: string;
    secondary: string;
    text: string;
    accent: string;
  };
  // Dynamic Hosts
  hostCount: number;
  hosts: HostConfig[];
  contentFormat: ContentFormat;
  visualizerCategories: string[]; // Selected categories for auto-switching
  youtubeAnalysisMode?: YoutubeAnalysisMode; // New field
}

export interface ScriptLine {
  speaker: string;
  text: string;
}

export interface AudioState {
  buffer: AudioBuffer | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export interface OutlineData {
  title: string;
  content: string;
  sources: string[];
}

export interface AudioSegment {
  speaker: string;
  text: string;
  audioData: string; // Base64
}

export interface Caption {
  speaker: string;
  text: string;
  start: number;
  end: number;
}

export interface ImpactfulWord {
  text: string;
  start: number;
  end: number;
  emotionalIntent?: string;
}

export interface ImpactfulImage {
  url: string;
  word: string;
  start: number;
  end: number;
}

// Visualizer Shared Types
export type VisualizerMode =
  'auto' |
  'circle' | 'bars' | 'wave' | 'particles' | 'matrix' | 'kaleidoscope' | 'face' | 'orb' | 'geometric' | 'plasma' |
  'dna' | 'neuralNet' | 'galaxy' | 'landscape' | 'ripple' | 'hexGrid' | 'newsRadar' | 'string' | 'flower' | 'digitalRain' |
  'drawRLGridworldVisualizer' | 'drawPolicyArrowsVisualizer' | 'drawNeuralNetworkGraphVisualizer' | 'drawQTableHeatmapVisualizer' | 'drawRobotOutlineVisualizer' | 'drawTigerStripesVisualizer' | 'drawStateTransitionGraphVisualizer' |
  'drawTokenLatticeVisualizer' | 'drawAttentionMatrixVisualizer' | 'drawAgentSwarmVisualizer' | 'drawBouncingBlobsVisualizer' | 'drawBrainNetworkVisualizer';

export interface VisualizerPreset {
  name: string;
  visualizer: Exclude<VisualizerMode, 'auto'>; // Function name mapping
  hueShift: number; // Offset for the base hue
  duration: number; // How long this preset stays active in seconds
}

export type CaptionStyle = 'boxed' | 'karaoke' | 'minimal';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}
