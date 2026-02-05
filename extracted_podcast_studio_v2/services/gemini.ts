
import { GoogleGenAI, Modality } from "@google/genai";
import { PodcastSettings, OutlineData, AudioSegment } from "../types";
import { VOICE_OPTIONS } from "../constants";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API_KEY environment variable is missing.");
  }
  return new GoogleGenAI({ apiKey });
};

// Cache promises instead of results to handle in-flight deduplication
const previewCache = new Map<string, Promise<string | null>>();

export const generateOutline = async (settings: PodcastSettings): Promise<OutlineData> => {
  const ai = getClient();

  // Detect YouTube URL
  const urlPattern = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = settings.topic.match(urlPattern);
  const isYoutube = !!match;
  const videoId = match ? match[1] : '';

  let researchInstructions = '';
  
  if (isYoutube) {
    const mode = settings.youtubeAnalysisMode || 'deep_dive';
    
    let analysisDirective = '';
    switch(mode) {
        case 'debate':
            analysisDirective = "Look for CONTROVERSIES, logical fallacies, or weak points in the video's argument. Find counter-arguments from other experts.";
            break;
        case 'reaction':
            analysisDirective = "Identify the most SHOCKING, funny, or emotional moments. The outline should focus on the hosts reacting to these specific clips/segments.";
            break;
        case 'educational':
            analysisDirective = "Break down the video's core concepts into a simple 101 lesson. Define jargon. Use analogies.";
            break;
        case 'summary':
            analysisDirective = "Create a concise executive summary. Top 3 takeaways. No fluff.";
            break;
        case 'deep_dive':
        default:
            analysisDirective = "Perform a deep structural analysis. What is the subtext? What is the creator NOT saying? Connect this video to broader industry trends.";
            break;
    }

    researchInstructions = `
    ### 🔴 YOUTUBE DEEP INTELLIGENCE PROTOCOL
    **TARGET VIDEO ID**: ${videoId}
    **ANALYSIS MODE**: ${mode.toUpperCase()}

    **EXECUTE THE FOLLOWING RESEARCH STEPS**:
    1.  **IDENTIFICATION**: Search for "youtube video ${videoId}" to find the EXACT Title and Channel Name.
    2.  **TRANSCRIPT MINING**: Search for "transcript of [Video Title]", "key takeaways [Video Title]", or "summary of [Video Title] by [Channel]".
    3.  **SENTIMENT ANALYSIS**: Search for "reddit discussion [Video Title]" or "comments on [Video Title]" to see what people are saying.
    4.  **SYNTHESIS**: ${analysisDirective}
    
    **CRITICAL**: Do NOT hallucinate the video content. If you cannot find the specific video details, admit it and pivot the podcast to be a general discussion about the likely topic inferred from the URL context or title found.
    `;
  } else {
    researchInstructions = `
    ### TOPIC RESEARCH PROTOCOL:
    1.  **SEARCH**: Perform a deep-dive search on: "${settings.topic}".
    2.  **ANGLES**: Look for:
        - The "Mainstream View" (What everyone thinks)
        - The "Contrarian View" (What experts/insiders know)
        - "The Why" (Why does this matter right now?)
    `;
  }

  // Dynamic Structure based on Format
  let structureInstruction = "";
  switch(settings.contentFormat) {
      case 'news':
          structureInstruction = `
          **BLUEPRINT: TV NEWS BROADCAST**
          - **Cold Open**: Breaking news alert + Soundbite.
          - **The Lead**: Who, what, where, when (Fast paced).
          - **The Context**: Why it matters (The Analyst weighs in).
          - **The Kicker**: A final thought or forward-looking statement.
          `;
          break;
      case 'reels':
          structureInstruction = `
          **BLUEPRINT: VIRAL SHORT (TIKTOK/REELS)**
          - **The Hook (0-3s)**: A visual or intellectual provocation.
          - **The Retension Loop**: Rapid-fire facts that build tension.
          - **The Payoff**: The secret/answer revealed.
          - **The CTA**: "Comment below if..."
          `;
          break;
      case 'research':
          structureInstruction = `
          **BLUEPRINT: ACADEMIC DEEP DIVE**
          - **Abstract**: The core hypothesis.
          - **Literature Review**: What we knew before.
          - **Methodology/New Finding**: The breakthrough.
          - **Discussion**: Implications for the future.
          `;
          break;
      default: // podcast
          structureInstruction = `
          **BLUEPRINT: NARRATIVE PODCAST**
          - **The Tease**: A shocking fact or out-of-context quote from later in the episode.
          - **The Intro**: Host banter, setting the stage, "Why are we talking about this?"
          - **Act I**: The Setup (The Problem/Mystery).
          - **Act II**: The Turn (New info, conflict, debate between hosts).
          - **Act III**: The Resolution (Takeaways and synthesis).
          `;
          break;
  }

  const prompt = `
    You are an elite Lead Producer for a major media network. 
    Your job is to build a compelling narrative skeleton for an audio production.

    ### INPUT DATA
    - **Topic**: "${settings.topic}"
    - **Target Audience**: ${settings.targetAudience}
    - **Format**: ${settings.contentFormat.toUpperCase()}
    - **Tone**: ${settings.tone}

    ${researchInstructions}

    ${structureInstruction}

    ### CRITICAL INSTRUCTION:
    Do not just list facts. Create a *narrative arc*. 
    If it's a podcast, find the *conflict* or the *mystery*.
    If it's news, find the *urgency*.
    
    If analyzing a YouTube video, explicitly mention the Channel Name and Video Title in the intro.

    ### OUTPUT FORMAT (Markdown):
    # [Catchy, Clickable Title]
    
    **Premise**: [1-sentence elevator pitch]

    **Section 1: [Name]**
    - Beat: [Specific detail/talking point]
    - Beat: [Specific detail/talking point]

    **Section 2: [Name]**
    - Beat: [Specific detail/talking point]
    - Beat: [Specific detail/talking point]
    
    ... (Continue based on blueprint)
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      temperature: 0.75 // Slightly higher for creativity
    }
  });

  const sources: string[] = [];
  if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
    response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri) {
        sources.push(chunk.web.uri);
      }
    });
  }

  const content = response.text || "Failed to generate outline. Please try again with a more specific topic.";
  
  // Extract title from markdown (# Title) or fallback to topic
  let title = settings.topic;
  const titleMatch = content.match(/^#\s+(.+)/m);
  if (titleMatch) {
    title = titleMatch[1].trim();
  }

  return {
    title,
    content,
    sources: [...new Set(sources)]
  };
};

export const generateScript = async (outline: string, settings: PodcastSettings): Promise<string> => {
  const ai = getClient();
  
  // Calculate word count logic
  let minutes = parseInt(settings.duration);
  if (isNaN(minutes) || minutes < 1) minutes = 5;
  // Podcasts average 150 words/min. We buffer slightly for pacing instructions.
  const wordCount = Math.min(minutes * 160, 10000).toString(); 

  // --- 1. DEEP PERSONA ARCHETYPES ---
  const PERSONA_MATRIX: Record<string, string> = {
    'The Tech Lead': `
      - **Vibe**: CTO / Engineering Manager. Pragmatic, slightly cynical about hype.
      - **Phrasing**: "Does it scale?", "Let's look at the trade-offs", "The happy path".
      - **Audio Traits**: Uses [sigh] when mentioning legacy code. Fast talker.
    `,
    'The Insight': `
      - **Vibe**: Cultural Anthropologist / Storyteller. Connects dots between tech and humanity.
      - **Phrasing**: "It's about the narrative", "Think about the human cost", "Zoom out for a second".
      - **Audio Traits**: Warm tone. Uses [short pause] for emphasis.
    `,
    'The Professor': `
      - **Vibe**: Oxford Don. Precise, articulate, historically minded.
      - **Phrasing**: "Fundamentally", "We must consider", "In the grand scheme".
      - **Audio Traits**: Enunciates clearly. Uses [clearing throat] before correcting someone.
    `,
    'The Veteran': `
      - **Vibe**: 30 years in the industry. Has seen it all. Unimpressed by trends.
      - **Phrasing**: "I remember when...", "Back in the day", "It's just a tool".
      - **Audio Traits**: Gravelly delivery. Laughs at naive ideas.
    `,
    'The Influencer': `
      - **Vibe**: Gen-Z TikTok Creator. High energy, trend-focused, hyperbolic.
      - **Phrasing**: "That's insane", "Literally", "Vibe shift", "I'm obsessed".
      - **Audio Traits**: Uses [laughing] often. Very dynamic pitch.
    `,
    'The Futurist': `
      - **Vibe**: Silicon Valley Visionary. Optimistic, intense, speaks in absolutes.
      - **Phrasing**: "Paradigm shift", "Exponential", "The singularity", "Inevitability".
      - **Audio Traits**: Fast paced [fast]. Intense focus.
    `,
    'Radio Host': `
      - **Vibe**: NPR / BBC Anchor. Neutral, guiding, master of transitions.
      - **Phrasing**: "Let's pivot to...", "That brings up a good point", "For our listeners".
      - **Audio Traits**: Smooth, polished, rhythmic.
    `
  };

  // --- 2. DYNAMIC CHEMISTRY MAPPING ---
  const hosts = settings.hosts;
  
  const hostInstructions = hosts.map((h, index) => {
    const preset = VOICE_OPTIONS.find(v => v.id === h.voiceId);
    const label = preset?.label || "Radio Host";
    const accent = preset?.accent || "Standard";
    
    const personaDef = PERSONA_MATRIX[label] || PERSONA_MATRIX['Radio Host'];

    const roleDef = index === 0 
      ? `**ROLE: THE ANCHOR**. You control the pacing. You introduce the topics. You keep the show moving.`
      : `**ROLE: THE COLOR**. You add depth, humor, disagreement, or expert analysis. You disrupt the Anchor's flow naturally.`;

    let accentInstruction = "";
    if (accent.includes("Indian")) {
      accentInstruction = `**DIALECT**: Indian English. Use natural Indian idioms where appropriate (e.g., "do the needful", "prepone", "funda"). Sentence rhythm should be melodious.`;
    }

    // NEW: Enforce Language Constraints Per Host
    // This is critical to prevent hosts from reverting to English due to their persona "Phrasing" examples.
    let languageConstraint = "";
    if (settings.language !== 'English') {
        languageConstraint = `\n**LANGUAGE RULE**: This host MUST speak in ${settings.language}. Do not revert to English.`;
        if (settings.language === 'Hindi' || settings.language === 'Hinglish') {
             languageConstraint += settings.scriptFormat === 'devanagari' 
                ? " Use Devanagari script." 
                : " Use Roman script.";
        }
    }

    return `### HOST ${index + 1}: "${h.name}" (${label})\n${roleDef}\n${personaDef}\n${accentInstruction}${languageConstraint}`;
  }).join('\n');


  // --- 3. LANGUAGE & SCRIPT FORMATTING ---
  let scriptFormatInstruction = "";
  if (settings.language === 'Hindi' || settings.language === 'Hinglish') {
    if (settings.scriptFormat === 'devanagari') {
        scriptFormatInstruction = `**LANGUAGE MODE**: Hindi/Hinglish (Devanagari Script). Use Hindi for conversation, English for technical terms.`;
    } else {
        scriptFormatInstruction = `**LANGUAGE MODE**: Hindi/Hinglish (Roman Script). e.g., "Haan, bilkul sahi kaha tumne."`;
    }
  } else {
      scriptFormatInstruction = `**LANGUAGE MODE**: ${settings.language}. Natural, idiomatic conversation.`;
  }

  // --- 4. ADVANCED TTS DIRECTION ---
  const ttsInstructions = `
    ### ADVANCED TTS CHOREOGRAPHY
    You must instruct the Voice AI on *how* to speak using these brackets:
    - **[laughing]**: Use for genuine laughter.
    - **[sigh]**: Use for realization, relief, or exhaustion.
    - **[short pause]**: Use for dramatic effect or thinking.
    - **[clearing throat]**: Before correcting someone.
    - **[fast]**: For disclaimers or excitement.
    
    **BREATH GROUPS**:
    Break long sentences into chunks of 10-15 words.
    *Bad*: "The economy is crashing because the rates are too high and nobody can afford homes."
    *Good*: "The economy is crashing... [short pause] rates are too high... and nobody can afford homes."
    
    **EMOTIONAL ALIGNMENT**:
    If the text is scary, the prompt implies [whispering].
    If the text is funny, use [laughing].
  `;

  const prompt = `
    You are the Showrunner and Head Writer for a top-tier Audio Production Studio.
    
    **YOUR MISSION**: Write a script that sounds 100% indistinguishable from a real human conversation.
    **THE ENEMY**: "AI Voice". Do not write like an AI. Do not use robotic transitions like "Let us delve into".
    
    ### SOURCE MATERIAL
    ${outline}

    ### GLOBAL SETTINGS
    - **Target Length**: ~${wordCount} words
    - **Tone**: ${settings.tone}
    - **Audience**: ${settings.targetAudience}
    ${scriptFormatInstruction}
    **IMPORTANT**: The entire conversation must be in the specified LANGUAGE MODE. Do not have one host speak English while the other speaks the target language.

    ### THE CAST
    ${hostInstructions}

    ${ttsInstructions}

    ### WRITING STYLE GUIDE - "WRITE FOR THE EAR"
    - **No monologues**. Nobody speaks in paragraphs. Break it up.
    - **Interruptions**. Hosts should interrupt each other using "--" at the end of a line.
    - **Fillers**. Use "Look," "Listen," "I mean," "Actually," to start sentences naturally.
    - **Chemistry**. If Host 1 says something crazy, Host 2 should react shocked. If Host 1 makes a joke, Host 2 should laugh.

    ### GENERATION TASK
    Write the full script now.
    Format:
    Speaker Name: [tag] Dialogue...
    Speaker Name: Dialogue...
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
        temperature: 0.85, // High creativity for natural speech variance
        topP: 0.95,
        topK: 40
    }
  });

  return response.text || "Failed to generate script.";
};

export const previewVoice = (voiceId: string, language: string = 'English', scriptFormat: string = 'roman'): Promise<string | null> => {
  const cacheKey = `${voiceId}-${language}-${scriptFormat}`;
  
  if (previewCache.has(cacheKey)) {
    return previewCache.get(cacheKey)!;
  }

  const promise = (async () => {
    const ai = getClient();
    try {
      const preset = VOICE_OPTIONS.find(v => v.id === voiceId);
      const apiVoiceName = preset ? preset.apiId : 'Puck';

      // Optimized Short Text for Lower Latency
      let text = `Hi, I'm ${preset?.label || 'ready'}.`;

      // Localize preview text based on selected language (Keep it short!)
      if (language === 'Hindi' || language === 'Hinglish') {
          if (scriptFormat === 'devanagari') {
              text = "नमस्ते! मैं तैयार हूँ।";
          } else {
              text = "Namaste! Main taiyaar hoon.";
          }
      } else if (language === 'Spanish') {
          text = "¡Hola! Estoy listo.";
      } else if (language === 'French') {
          text = "Bonjour! Je suis prêt.";
      } else if (language === 'German') {
          text = "Hallo! Ich bin bereit.";
      } else if (language === 'Portuguese') {
          text = "Olá! Estou pronto.";
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: apiVoiceName }
            }
          }
        }
      });
      
      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!data) {
          // If data is null, evict from cache so we can try again later
          previewCache.delete(cacheKey);
          return null;
      }
      return data;
    } catch (e) {
      console.error("Voice preview failed", e);
      previewCache.delete(cacheKey);
      return null;
    }
  })();

  previewCache.set(cacheKey, promise);
  return promise;
};

export const generateAudio = async (script: string, settings: PodcastSettings): Promise<AudioSegment[]> => {
  const ai = getClient();
  const hosts = settings.hosts;

  // 1. Clean and Parse Script
  // Remove formatting but KEEP brackets like [laughing] because we want the AI to see them.
  // We only remove stage directions in parenthesis if they look like (Stage Direction).
  const cleanForSplit = script
    .replace(/\*\*/g, '') // Remove bold
    .replace(/^\s*[\-\*]\s+/gm, ''); // Remove list bullets
    // Note: We deliberately do NOT remove [brackets] here.

  const lines = cleanForSplit.split('\n').filter(line => line.trim() !== '');

  const segments: { speaker: string, text: string }[] = [];
  
  lines.forEach(line => {
      const colonIndex = line.indexOf(':');
      if (colonIndex > -1) {
          const speakerName = line.substring(0, colonIndex).trim();
          const text = line.substring(colonIndex + 1).trim();
          if (text) {
             segments.push({ speaker: speakerName, text });
          }
      }
  });

  if (segments.length === 0) {
      throw new Error("Could not parse script lines. Ensure format is 'Name: Text'.");
  }

  // 2. Generate Audio
  const BATCH_SIZE = 8;
  const allAudioSegments: AudioSegment[] = [];

  const generateSegment = async (seg: { speaker: string, text: string }): Promise<AudioSegment | null> => {
    try {
        const hostConfig = hosts.find(h => h.name.toLowerCase() === seg.speaker.toLowerCase());
        
        let apiVoiceName = 'Puck'; 
        if (hostConfig) {
            const preset = VOICE_OPTIONS.find(v => v.id === hostConfig.voiceId);
            if (preset) {
                apiVoiceName = preset.apiId;
            } else {
                apiVoiceName = hostConfig.voiceId; 
            }
        }
        
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: seg.text }] }],
            config: {
              responseModalities: [Modality.AUDIO],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: apiVoiceName }
                }
              }
            }
        });

        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        
        if (base64Audio) {
            return {
                speaker: seg.speaker,
                text: seg.text,
                audioData: base64Audio
            };
        }
        return null;
    } catch (e) {
        console.error(`Failed to generate audio for line: "${seg.text.substring(0, 20)}..."`, e);
        return null;
    }
  };

  for (let i = 0; i < segments.length; i += BATCH_SIZE) {
    const chunk = segments.slice(i, i + BATCH_SIZE);
    const promises = chunk.map(seg => generateSegment(seg));
    const results = await Promise.all(promises);
    results.forEach(res => { if (res) allAudioSegments.push(res); });
  }
  
  return allAudioSegments;
};
