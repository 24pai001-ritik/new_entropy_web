
/**
 * Decodes a base64 string into a Uint8Array.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (or supported formats) into an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number = 24000,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  try {
    const bufferCopy = data.buffer.slice(0);
    return await ctx.decodeAudioData(bufferCopy);
  } catch (e) {
    console.warn("Standard decode failed, attempting raw PCM decode strategy.", e);

    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}

/**
 * Trims silence from the start and end of an AudioBuffer.
 * This creates a much more natural, conversational flow when stitching segments.
 */
export function trimAudioBuffer(ctx: AudioContext, buffer: AudioBuffer): AudioBuffer {
  const channels = buffer.numberOfChannels;
  const data = buffer.getChannelData(0); // Detect silence based on first channel
  const len = data.length;
  const threshold = 0.005; // Approx -46dB

  // Scan start
  let start = 0;
  while (start < len && Math.abs(data[start]) < threshold) {
    start++;
  }

  // Scan end
  let end = len - 1;
  while (end > start && Math.abs(data[end]) < threshold) {
    end--;
  }

  // Pad by 50ms (approx 1200 samples at 24k) to avoid clipping breath
  const padding = Math.floor(ctx.sampleRate * 0.05);
  start = Math.max(0, start - padding);
  end = Math.min(len, end + padding);

  const newLen = end - start;
  if (newLen <= 0) return buffer; // Should not happen unless fully silent

  const newBuffer = ctx.createBuffer(channels, newLen, buffer.sampleRate);
  for (let c = 0; c < channels; c++) {
    const chData = buffer.getChannelData(c);
    const newChData = newBuffer.getChannelData(c);
    for (let i = 0; i < newLen; i++) {
      newChData[i] = chData[start + i];
    }
  }
  return newBuffer;
}

/**
 * Concatenates multiple AudioBuffers into a single AudioBuffer.
 */
export function concatenateAudioBuffers(
  ctx: AudioContext,
  buffers: AudioBuffer[]
): AudioBuffer {
  const totalLength = buffers.reduce((acc, b) => acc + b.length, 0);
  // Use the channel count and sample rate of the first buffer (assuming consistency)
  const channels = buffers[0].numberOfChannels;
  const sampleRate = buffers[0].sampleRate;

  const result = ctx.createBuffer(channels, totalLength, sampleRate);

  let offset = 0;
  for (const buffer of buffers) {
    for (let i = 0; i < channels; i++) {
      result.getChannelData(i).set(buffer.getChannelData(i), offset);
    }
    offset += buffer.length;
  }

  return result;
}

/**
 * Creates a silent AudioBuffer of a given duration.
 */
export function createSilentBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  return ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
}

/**
 * Generates a synthetic Lo-Fi intro/outro jingle and mixes it with the speech.
 * Uses OfflineAudioContext for precise mixing and sample rate handling.
 */
export async function mixPodcastAudio(
  ctx: AudioContext, // Kept for signature compatibility
  speechBuffer: AudioBuffer,
  skipMusic: boolean = false // New flag to skip intro/outro
): Promise<AudioBuffer> {
  // Use speech sample rate (usually 24kHz) to avoid resampling artifacts and size issues
  const sampleRate = speechBuffer.sampleRate;

  if (skipMusic) {
    // Just return the speech buffer directly if music is skipped (e.g. for Reels)
    return speechBuffer;
  }

  const introSolo = 3.5;
  const overlap = 2.5;
  const jingleDuration = 6;

  const totalDuration = Math.ceil(introSolo + speechBuffer.duration + 3.5);

  // Create Offline Context matching the speech sample rate
  const offlineCtx = new (window.OfflineAudioContext || (window as any).webkitOfflineAudioContext)(
    2,
    totalDuration * sampleRate,
    sampleRate
  );

  // 1. Generate Jingle Buffer
  const jingleBuffer = offlineCtx.createBuffer(2, sampleRate * jingleDuration, sampleRate);

  for (let channel = 0; channel < 2; channel++) {
    const data = jingleBuffer.getChannelData(channel);
    for (let i = 0; i < data.length; i++) {
      const t = i / sampleRate;
      // Base Groove (Sine)
      const bass = Math.sin(t * 110 * Math.PI * 2) * Math.exp(-4 * (t % 1));
      // Melody (Pluck)
      let melody = 0;
      if (t < 4) {
        const note = [220, 330, 440, 550][Math.floor(t * 4) % 4];
        melody = Math.sin(t * note * Math.PI * 2) * Math.exp(-5 * ((t * 4) % 1));
      }
      data[i] = (bass * 0.3) + (melody * 0.2);
    }
  }

  // 2. Create Reversed Jingle for Outro
  const reversedJingle = offlineCtx.createBuffer(2, jingleBuffer.length, sampleRate);
  for (let channel = 0; channel < 2; channel++) {
    const src = jingleBuffer.getChannelData(channel);
    const dest = reversedJingle.getChannelData(channel);
    for (let i = 0; i < src.length; i++) {
      dest[i] = src[src.length - 1 - i];
    }
  }

  // 3. Schedule Sources in the Graph

  // A. Intro Music
  const introNode = offlineCtx.createBufferSource();
  introNode.buffer = jingleBuffer;
  const introGain = offlineCtx.createGain();
  introGain.gain.value = 0.6;

  introNode.connect(introGain);
  introGain.connect(offlineCtx.destination);

  introNode.start(0);
  // Fade out
  introGain.gain.setValueAtTime(0.6, introSolo);
  introGain.gain.linearRampToValueAtTime(0, introSolo + overlap);

  // B. Speech
  const speechNode = offlineCtx.createBufferSource();
  speechNode.buffer = speechBuffer;
  speechNode.connect(offlineCtx.destination);
  speechNode.start(introSolo);

  // C. Outro Music
  const outroNode = offlineCtx.createBufferSource();
  outroNode.buffer = reversedJingle;
  const outroGain = offlineCtx.createGain();
  outroGain.gain.value = 0;

  outroNode.connect(outroGain);
  outroGain.connect(offlineCtx.destination);

  const speechEnd = introSolo + speechBuffer.duration;
  const outroStart = speechEnd - overlap;

  outroNode.start(outroStart);
  // Fade in
  outroGain.gain.setValueAtTime(0, outroStart);
  outroGain.gain.linearRampToValueAtTime(0.6, outroStart + overlap);

  // 4. Render
  return await offlineCtx.startRendering();
}

/**
 * Converts an AudioBuffer to a WAV Blob.
 */
export function bufferToWave(abuffer: AudioBuffer, len: number): Blob {
  let numOfChan = abuffer.numberOfChannels;
  let length = len * numOfChan * 2 + 44;
  let buffer = new ArrayBuffer(length);
  let view = new DataView(buffer);
  let channels = [], i, sample, offset = 0, pos = 0;

  // write WAVE header
  setUint32(0x46464952);                         // "RIFF"
  setUint32(length - 8);                         // file length - 8
  setUint32(0x45564157);                         // "WAVE"

  setUint32(0x20746d66);                         // "fmt " chunk
  setUint32(16);                                 // length = 16
  setUint16(1);                                  // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(abuffer.sampleRate);
  setUint32(abuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2);                      // block-align
  setUint16(16);                                 // 16-bit (hardcoded in this writer)

  setUint32(0x61746164);                         // "data" - chunk
  setUint32(length - pos - 4);                   // chunk length

  // write interleaved data
  for (i = 0; i < abuffer.numberOfChannels; i++)
    channels.push(abuffer.getChannelData(i));

  let sampleIndex = 0;
  while (sampleIndex < len) {
    for (i = 0; i < numOfChan; i++) {             // interleave channels
      sample = Math.max(-1, Math.min(1, channels[i][sampleIndex])); // clamp
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0; // scale to 16-bit signed int
      view.setInt16(44 + offset, sample, true);          // write 16-bit sample
      offset += 2;
    }
    sampleIndex++;
  }

  return new Blob([buffer], { type: "audio/wav" });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}