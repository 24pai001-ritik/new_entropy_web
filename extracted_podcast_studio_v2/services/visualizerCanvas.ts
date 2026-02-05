
import { Caption, CaptionStyle, Particle } from '../types';

// Union type to support both on-screen and off-screen canvas contexts
export type VisualizerContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

// --- SKETCH HELPERS ---

const randomJitter = (amount: number) => (Math.random() - 0.5) * amount;

const sketchLine = (ctx: VisualizerContext, x1: number, y1: number, x2: number, y2: number, jitter: number = 2) => {
    ctx.beginPath();
    ctx.moveTo(x1 + randomJitter(jitter), y1 + randomJitter(jitter));
    ctx.lineTo(x2 + randomJitter(jitter), y2 + randomJitter(jitter));
    ctx.stroke();
    
    // Second stroke (Sketch style)
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = oldAlpha * 0.6;
    ctx.beginPath();
    ctx.moveTo(x1 + randomJitter(jitter * 1.5), y1 + randomJitter(jitter * 1.5));
    ctx.lineTo(x2 + randomJitter(jitter * 1.5), y2 + randomJitter(jitter * 1.5));
    ctx.stroke();
    ctx.globalAlpha = oldAlpha;
};

const sketchCircle = (ctx: VisualizerContext, x: number, y: number, r: number, jitter: number = 2) => {
    ctx.beginPath();
    // Imperfect circle 1
    ctx.ellipse(
        x + randomJitter(jitter), 
        y + randomJitter(jitter), 
        r + randomJitter(jitter), 
        r + randomJitter(jitter), 
        0, 0, Math.PI * 2
    );
    ctx.stroke();

    // Imperfect circle 2
    const oldAlpha = ctx.globalAlpha;
    ctx.globalAlpha = oldAlpha * 0.5;
    ctx.beginPath();
    ctx.ellipse(
        x + randomJitter(jitter), 
        y + randomJitter(jitter), 
        r * 1.05 + randomJitter(jitter), 
        r * 0.95 + randomJitter(jitter), 
        Math.random(), 0, Math.PI * 2
    );
    ctx.stroke();
    ctx.globalAlpha = oldAlpha;
};

const sketchRect = (ctx: VisualizerContext, x: number, y: number, w: number, h: number, jitter: number = 2) => {
    sketchLine(ctx, x, y, x + w, y, jitter);
    sketchLine(ctx, x + w, y, x + w, y + h, jitter);
    sketchLine(ctx, x + w, y + h, x, y + h, jitter);
    sketchLine(ctx, x, y + h, x, y, jitter);
};

const sketchArrow = (ctx: VisualizerContext, x1: number, y1: number, x2: number, y2: number, size: number) => {
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const jitter = size * 0.1;
    
    // Shaft
    sketchLine(ctx, x1, y1, x2, y2, jitter);
    
    // Head
    const headLen = size * 0.3;
    sketchLine(ctx, x2, y2, x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6), jitter);
    sketchLine(ctx, x2, y2, x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6), jitter);
};

// --- EXISTING VISUALIZERS ---

export const drawCircleVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(w, h) * 0.25;
  const barHeightMultiplier = Math.min(w, h) * 0.2;

  ctx.save();
  ctx.translate(cx, cy);

  const bars = 64;
  const step = Math.floor(bufferLength / bars);

  for (let i = 0; i < bars; i++) {
    const value = dataArray[i * step] / 255.0;
    const barHeight = value * barHeightMultiplier;
    
    ctx.rotate((Math.PI * 2) / bars);
    
    ctx.fillStyle = `hsl(${hue + (i / bars) * 180}, 100%, 50%)`;
    ctx.beginPath();
    // Fallback for environments where roundRect is not typed or supported
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-2, radius, 4, barHeight, 2);
    } else {
        ctx.fillRect(-2, radius, 4, barHeight);
    }
    ctx.fill();
    
    // Mirror
    ctx.beginPath();
     if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(-2, radius + barHeight + 5, 4, 4, 2);
    } else {
        ctx.fillRect(-2, radius + barHeight + 5, 4, 4);
    }
    ctx.fill();
  }
  
  // Center Glow
  const avg = dataArray.slice(0, 20).reduce((a, b) => a + b, 0) / 20 / 255;
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.8 * (0.8 + avg * 0.4), 0, Math.PI * 2);
  ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${0.2 + avg * 0.3})`;
  ctx.fill();

  ctx.restore();
};

export const drawBarsVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const barWidth = (w / bufferLength) * 2.5;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * h * 0.8;
        
        ctx.fillStyle = `hsl(${hue + (i/bufferLength)*120}, 100%, 50%)`;
        ctx.fillRect(x, h - barHeight, barWidth, barHeight);

        x += barWidth + 1;
        if (x > w) break;
    }
};

export const drawWaveVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    ctx.lineWidth = 4;
    ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
    ctx.beginPath();

    const sliceWidth = w * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = v * h / 2;

        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }

        x += sliceWidth;
    }

    ctx.lineTo(w, h / 2);
    ctx.stroke();
};

export const drawParticlesVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number, particles: Particle[]) => {
    const cx = w / 2;
    const cy = h / 2;
    
    // Calculate average volume for impact
    let sum = 0;
    for(let i=0; i<bufferLength; i++) sum += dataArray[i];
    const avg = sum / bufferLength / 255; // 0 to 1

    // Spawn particles on beat (roughly)
    if (avg > 0.4 && particles.length < 100) {
        for(let i=0; i<5; i++) {
            particles.push({
                x: cx,
                y: cy,
                vx: (Math.random() - 0.5) * 20 * avg,
                vy: (Math.random() - 0.5) * 20 * avg,
                size: Math.random() * 10 + 2,
                color: `hsl(${hue + Math.random()*60}, 100%, 70%)`,
                life: 1.0,
                maxLife: 1.0
            });
        }
    }

    // Update and Draw
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        p.size *= 0.95;

        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;
};

export const drawMatrixVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
     const cols = 50;
     const colWidth = w / cols;
     const step = Math.floor(bufferLength / cols);
     
     for (let i = 0; i < cols; i++) {
         const val = dataArray[i * step] / 255;
         const count = Math.floor(val * 20); // number of blocks
         
         ctx.fillStyle = `hsla(${hue}, 100%, 50%, 0.8)`;
         
         for (let j = 0; j < count; j++) {
             ctx.fillRect(i * colWidth, h - (j * (h/20)) - (h/20*0.8), colWidth * 0.8, h/20 * 0.8);
         }
     }
};

export const drawKaleidoscopeVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.4;
    const slices = 12;
    
    ctx.save();
    ctx.translate(cx, cy);

    for (let i = 0; i < slices; i++) {
        ctx.save();
        ctx.rotate(i * (Math.PI * 2 / slices));
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        
        // Use frequency data to define polygon edge
        const step = Math.floor(bufferLength / 20);
        for(let j=0; j<20; j++) {
            const v = dataArray[j * step] / 255;
            const r = (j/20) * radius;
            const width = v * (radius / 5);
            ctx.lineTo(r, width);
        }
        ctx.lineTo(radius, 0);
        
        ctx.fillStyle = `hsla(${hue + i * 20}, 80%, 60%, 0.5)`;
        ctx.fill();
        ctx.restore();
    }
    
    ctx.restore();
};

export const drawOrbVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const avg = dataArray.slice(0, 50).reduce((a, b) => a + b, 0) / 50 / 255;
    
    const radius = Math.min(w, h) * 0.3 * (0.8 + avg * 0.4);

    const grad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
    grad.addColorStop(0, `hsl(${hue}, 100%, 90%)`);
    grad.addColorStop(0.5, `hsl(${hue}, 100%, 50%)`);
    grad.addColorStop(1, `transparent`);

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Outer rings
    ctx.strokeStyle = `hsla(${hue + 180}, 100%, 70%, 0.5)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, radius * 1.2 + (avg * 20), 0, Math.PI * 2);
    ctx.stroke();
};

export const drawGeometricVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.45;
    
    ctx.lineWidth = 3;
    const shapes = 5;
    
    for(let i=0; i<shapes; i++) {
        const idx = Math.floor((i / shapes) * bufferLength * 0.5);
        const val = dataArray[idx] / 255;
        const r = (maxR / shapes) * (i + 1) * (0.8 + val * 0.4);
        
        ctx.strokeStyle = `hsl(${hue + i * 30}, 80%, 60%)`;
        ctx.beginPath();
        
        const sides = 3 + i;
        const angleStep = (Math.PI * 2) / sides;
        
        // Rotate shapes over time based on hue/time implicit
        const rotation = hue * 0.01 * (i % 2 === 0 ? 1 : -1);
        
        for(let j=0; j<=sides; j++) {
            const angle = j * angleStep + rotation;
            const px = cx + Math.cos(angle) * r;
            const py = cy + Math.sin(angle) * r;
            if (j===0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.stroke();
    }
};

export const drawPlasmaVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    // Simplified plasma-like effect using gradients and arcs based on frequency
    const cx = w / 2;
    const cy = h / 2;
    
    // Composite multiple globs
    const blobs = 8;
    for(let i=0; i<blobs; i++) {
        const idx = Math.floor((i/blobs) * bufferLength * 0.3);
        const val = dataArray[idx] / 255; // 0-1
        
        const angle = (i / blobs) * Math.PI * 2 + (hue * 0.05);
        const dist = val * Math.min(w, h) * 0.4;
        
        const x = cx + Math.cos(angle) * dist;
        const y = cy + Math.sin(angle) * dist;
        const r = Math.min(w, h) * 0.15 * (0.5 + val);
        
        const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, `hsla(${hue + i * 40}, 100%, 70%, 0.8)`);
        grad.addColorStop(1, `hsla(${hue + i * 40}, 100%, 50%, 0)`);
        
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI*2);
        ctx.fill();
    }
};

export const drawFaceVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const minDim = Math.min(w, h);

    // Audio Analysis buckets
    let low = 0; // Bass
    let mid = 0; // Voice/Mids
    let high = 0; // Consonants/Highs
    
    const len = Math.min(bufferLength, 100);
    for(let i=0; i<10; i++) low += (dataArray[i] || 0);
    for(let i=10; i<50; i++) mid += (dataArray[i] || 0);
    for(let i=50; i<len; i++) high += (dataArray[i] || 0);
    
    low = low / (10 * 255);
    mid = mid / (40 * 255);
    high = high / ((len-50) * 255);

    ctx.save();
    ctx.translate(cx, cy);

    const outlineColor = `hsl(${hue}, 95%, 60%)`; 
    const skinGlow = `hsla(${hue}, 100%, 85%, 0.1)`;
    
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = minDim * 0.05;

    // HEAD
    ctx.beginPath();
    ctx.ellipse(0, 0, minDim * 0.38, minDim * 0.44, 0, 0, Math.PI * 2);
    ctx.fillStyle = skinGlow;
    ctx.fill();
    ctx.lineWidth = minDim * 0.015;
    ctx.strokeStyle = outlineColor;
    ctx.stroke();

    // EYES
    const eyeSpacing = minDim * 0.16;
    const eyeY = -minDim * 0.08;
    const eyeRadius = minDim * 0.075 * (1 + (low * 0.2)); 

    const drawHappyEye = (offsetX: number) => {
        ctx.save();
        ctx.translate(offsetX, eyeY);
        
        const browOffset = minDim * 0.18 + (high * minDim * 0.05); 
        const browAngle = 0.15 + (mid * 0.2); 
        
        ctx.save();
        ctx.translate(0, -browOffset);
        ctx.rotate(offsetX < 0 ? -browAngle : browAngle);
        
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineWidth = minDim * 0.01;
        ctx.arc(0, 0, minDim * 0.08, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
        ctx.restore();

        const squintFactor = 0.85 - (mid * 0.15);
        ctx.scale(1, squintFactor);
        
        ctx.beginPath();
        ctx.arc(0, 0, eyeRadius, 0, Math.PI*2);
        ctx.fillStyle = `hsla(${hue}, 30%, 10%, 0.1)`; 
        ctx.fill();
        ctx.stroke();
        
        ctx.beginPath();
        const pupilX = (Math.random() - 0.5) * mid * eyeRadius * 0.2;
        const pupilY = (Math.random() - 0.5) * mid * eyeRadius * 0.2;
        ctx.arc(pupilX, pupilY, eyeRadius * 0.55, 0, Math.PI*2);
        ctx.fillStyle = outlineColor;
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(eyeRadius * 0.2, -eyeRadius * 0.2, eyeRadius * 0.2, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,255,255,0.8)';
        ctx.fill();
        
        ctx.restore();
    };

    drawHappyEye(-eyeSpacing);
    drawHappyEye(eyeSpacing);

    // NOSE
    ctx.beginPath();
    ctx.arc(0, minDim * 0.06, minDim * 0.025, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${hue}, 80%, 70%, 0.6)`;
    ctx.fill();

    // MOUTH
    const mouthW = minDim * 0.42;
    const mouthY = minDim * 0.18; 
    
    ctx.beginPath();
    ctx.lineWidth = minDim * 0.012;
    
    const smileDepth = minDim * 0.15 + (mid * minDim * 0.3); 
    const smileWidth = mouthW * (1 + high * 0.1); 

    ctx.moveTo(-smileWidth/2, mouthY);
    ctx.quadraticCurveTo(0, mouthY + smileDepth, smileWidth/2, mouthY);
    
    if (mid > 0.3) {
        ctx.fillStyle = `hsla(350, 80%, 20%, 0.3)`;
        ctx.fill();
    }
    ctx.stroke();

    // CHEEKS
    const baseBlush = 0.3;
    const blushIntensity = baseBlush + (mid * 0.7);
    ctx.globalAlpha = Math.min(0.8, blushIntensity);
    ctx.fillStyle = `hsla(340, 100%, 75%, 0.6)`; 
    
    ctx.beginPath();
    ctx.ellipse(-eyeSpacing - minDim*0.12, eyeY + minDim*0.25, minDim*0.08, minDim*0.05, 0, 0, Math.PI*2);
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(eyeSpacing + minDim*0.12, eyeY + minDim*0.25, minDim*0.08, minDim*0.05, 0, 0, Math.PI*2);
    ctx.fill();
    
    ctx.globalAlpha = 1.0;
    ctx.restore();
};

export const drawDNAVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const points = 50;
    const height = h * 0.8;
    const startY = (h - height) / 2;
    
    // Analyze Audio
    const bass = dataArray.slice(0, 10).reduce((a,b)=>a+b,0) / (10 * 255);
    const mids = dataArray.slice(10, 40).reduce((a,b)=>a+b,0) / (30 * 255);
    
    const amp = w * 0.15 * (0.5 + mids);
    const freq = 0.1;
    const phase = hue * 0.05;
    
    ctx.lineWidth = 2 + bass * 8;
    ctx.lineCap = 'round';
    
    for(let i=0; i<points; i++) {
        const y = startY + (i / points) * height;
        const offset = i * 0.3;
        
        // Strand 1
        const x1 = cx + Math.sin(offset + phase) * amp;
        // Strand 2
        const x2 = cx + Math.sin(offset + phase + Math.PI) * amp;
        
        // Connector
        const colorVal = Math.floor(((i/points) * 360 + hue) % 360);
        ctx.strokeStyle = `hsla(${colorVal}, 100%, 60%, 0.6)`;
        
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        
        // Dots
        ctx.fillStyle = `hsl(${colorVal}, 100%, 80%)`;
        ctx.beginPath();
        ctx.arc(x1, y, 4 + bass*4, 0, Math.PI*2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(x2, y, 4 + bass*4, 0, Math.PI*2);
        ctx.fill();
    }
};

export const drawNeuralNetVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    // Deterministic nodes based on grid
    const cols = 6;
    const rows = 6;
    const cellW = w / cols;
    const cellH = h / rows;
    
    const bass = dataArray[5] / 255;
    const high = dataArray[100] || 0 / 255;
    
    const nodes: {x: number, y: number, val: number}[] = [];
    
    for(let i=0; i<cols; i++) {
        for(let j=0; j<rows; j++) {
            const idx = (i * rows + j) % bufferLength;
            const val = dataArray[idx] / 255;
            // Jitter position slightly with audio
            const jx = Math.sin(hue * 0.05 + idx) * 10 * val;
            const jy = Math.cos(hue * 0.05 + idx) * 10 * val;
            
            nodes.push({
                x: i * cellW + cellW/2 + jx,
                y: j * cellH + cellH/2 + jy,
                val
            });
        }
    }
    
    // Draw Connections
    ctx.strokeStyle = `hsla(${hue}, 80%, 60%, 0.3)`;
    ctx.lineWidth = 1 + high * 2;
    
    nodes.forEach((n1, idx1) => {
        nodes.forEach((n2, idx2) => {
            if (idx1 === idx2) return;
            const dx = n1.x - n2.x;
            const dy = n1.y - n2.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // Connect close nodes and pulse with audio value
            if (dist < Math.min(w,h) * 0.25) {
                const alpha = (n1.val + n2.val) / 2;
                if (alpha > 0.4) {
                    ctx.globalAlpha = alpha;
                    ctx.beginPath();
                    ctx.moveTo(n1.x, n1.y);
                    ctx.lineTo(n2.x, n2.y);
                    ctx.stroke();
                    
                    // Traveling Spark (Highs)
                    if (high > 0.6) {
                        const t = (hue * 0.1) % 1;
                        const lx = n1.x + (n2.x - n1.x) * t;
                        const ly = n1.y + (n2.y - n1.y) * t;
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(lx-2, ly-2, 4, 4);
                    }
                }
            }
        });
        
        // Draw Node
        ctx.globalAlpha = 1.0;
        ctx.fillStyle = `hsl(${hue + n1.val * 60}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(n1.x, n1.y, 4 + n1.val * 10 * (1 + bass), 0, Math.PI*2);
        ctx.fill();
    });
};

export const drawGalaxyVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.min(w, h) * 0.45;
    
    const bass = dataArray.slice(0, 10).reduce((a,b)=>a+b,0) / (10 * 255);
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(hue * 0.01); // Slowly rotate whole galaxy
    
    const arms = 3;
    const particlesPerArm = 50;
    
    for(let arm=0; arm<arms; arm++) {
        for(let i=0; i<particlesPerArm; i++) {
            const progress = i / particlesPerArm; // 0 to 1 (center to edge)
            const angle = (arm / arms) * Math.PI * 2 + (progress * Math.PI * 2); // Spiral
            
            const r = progress * maxR * (1 + bass * 0.2);
            
            // Map particle to freq bin
            const bin = Math.floor(progress * (bufferLength/2));
            const val = dataArray[bin] / 255;
            
            const px = Math.cos(angle) * r;
            const py = Math.sin(angle) * r;
            
            // Spread jitter
            const spread = (Math.random() - 0.5) * 40 * progress;
            
            ctx.fillStyle = `hsla(${hue + progress * 90}, 100%, 70%, ${0.3 + val})`;
            ctx.beginPath();
            ctx.arc(px + spread, py + spread, 2 + val * 6, 0, Math.PI*2);
            ctx.fill();
        }
    }
    
    // Core
    const coreGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, maxR * 0.2);
    coreGlow.addColorStop(0, '#fff');
    coreGlow.addColorStop(0.5, `hsla(${hue}, 100%, 60%, 0.8)`);
    coreGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = coreGlow;
    ctx.beginPath();
    ctx.arc(0, 0, maxR*0.2, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
};

export const drawLandscapeVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    // 3 Layers of mountains
    const layers = 3;
    
    for(let l=0; l<layers; l++) {
        ctx.beginPath();
        ctx.moveTo(0, h);
        
        const offset = l * 50; // Audio offset
        const colorH = (hue + l * 30) % 360;
        ctx.fillStyle = `hsl(${colorH}, 60%, ${20 + l * 15}%)`;
        
        const speed = (layers - l) * 2; // Parallax speed
        const shiftX = (hue * speed) % w;
        
        for(let x=0; x<=w; x+=10) {
            // Perlin-ish noise using sine waves
            const noise = Math.sin((x + shiftX) * 0.01 * (l+1)) * 50 + 
                          Math.sin((x + shiftX) * 0.03 * (l+1)) * 20;
            
            // Audio reactivity
            const bin = Math.floor(((x / w) * bufferLength) / 2) + offset;
            const val = (dataArray[bin % bufferLength] / 255) * 100;
            
            const y = h - (100 + l * 80) - noise - val;
            ctx.lineTo(x, y);
        }
        
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();
    }
};

export const drawRippleVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const maxR = Math.sqrt(cx*cx + cy*cy);
    const rings = 20;
    
    const bass = dataArray[5] / 255; // Expand center
    
    for(let i=0; i<rings; i++) {
        const bin = Math.floor((i / rings) * (bufferLength / 2));
        const val = dataArray[bin] / 255;
        
        const baseR = (i / rings) * maxR;
        const r = baseR + val * 50 + bass * 20;
        
        ctx.strokeStyle = `hsla(${hue + i * 10}, 100%, 60%, ${0.2 + val * 0.8})`;
        ctx.lineWidth = 2 + val * 10;
        
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.stroke();
        
        // Highlights (Highs)
        if (val > 0.7) {
            ctx.fillStyle = '#fff';
            const angle = hue * 0.1 * (i%2===0?1:-1);
            ctx.beginPath();
            ctx.arc(cx + Math.cos(angle)*r, cy + Math.sin(angle)*r, 5, 0, Math.PI*2);
            ctx.fill();
        }
    }
};

export const drawHexGridVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const size = 40;
    const widthStep = size * Math.sqrt(3);
    const heightStep = size * 1.5;
    
    const cols = Math.ceil(w / widthStep) + 1;
    const rows = Math.ceil(h / heightStep) + 1;
    
    const drawHex = (x: number, y: number, r: number, color: string) => {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 3 * i + Math.PI / 6;
            ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
        }
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.stroke();
    };

    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            const xOffset = (r % 2 === 1) ? widthStep / 2 : 0;
            const x = c * widthStep + xOffset;
            const y = r * heightStep;
            
            // Map grid pos to audio bin
            const idx = ((r * cols + c) * 3) % bufferLength;
            const val = dataArray[idx] / 255;
            
            // Bass shake
            const shake = (dataArray[0]/255) * 5;
            
            const scale = size * 0.9 + (val * size * 0.5);
            const color = `hsla(${hue + val*120}, 60%, ${10 + val*50}%, 0.8)`;
            
            drawHex(x, y, scale, color);
        }
    }
};

export const drawNewsRadarVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.4;
    
    // Draw Grid
    ctx.strokeStyle = `hsla(${hue}, 100%, 50%, 0.3)`;
    ctx.lineWidth = 1;
    for(let i=1; i<=4; i++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * (i/4), 0, Math.PI*2);
        ctx.stroke();
    }
    // Crosshair
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx, cy + r);
    ctx.stroke();
    
    // Sweep
    const angle = (hue * 0.05) % (Math.PI * 2);
    
    const grad = ctx.createConicGradient(angle + Math.PI/2, cx, cy);
    grad.addColorStop(0, `hsla(${hue}, 100%, 60%, 0)`);
    grad.addColorStop(0.8, `hsla(${hue}, 100%, 60%, 0.1)`);
    grad.addColorStop(1, `hsla(${hue}, 100%, 60%, 0.8)`);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI*2);
    ctx.fill();
    
    // Blips (High Freqs)
    for(let i=0; i<20; i++) {
        // Pick random high freq bins
        const bin = Math.floor(bufferLength * 0.5) + Math.floor(Math.random() * bufferLength * 0.5);
        const val = dataArray[bin] / 255;
        
        if (val > 0.6) {
            // Random pos inside circle
            const dist = Math.random() * r;
            const theta = Math.random() * Math.PI * 2;
            
            ctx.fillStyle = '#fff';
            ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(theta)*dist, cy + Math.sin(theta)*dist, 3 + val*5, 0, Math.PI*2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
};

export const drawStringVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const centerY = h / 2;
    
    // We want a vibrating string effect. 
    // Since we usually get Frequency data, let's sum sines to simulate a waveform or just use freq magnitudes as displacement.
    
    ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    
    const segments = 100;
    
    for(let i=0; i<=segments; i++) {
        const x = (i / segments) * w;
        
        // Physics simulation using audio
        // Base sine wave modified by bass
        const bass = dataArray[5] / 255;
        const fundamental = Math.sin((i/segments) * Math.PI) * bass * h * 0.2;
        
        // Noise/Texture from mids/highs
        const idx = Math.floor((i / segments) * (bufferLength/2));
        const val = dataArray[idx] / 255;
        const detail = (Math.random() - 0.5) * val * 50;
        
        ctx.lineTo(x, centerY + fundamental + detail);
    }
    
    ctx.stroke();
    
    // Glow effect
    ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.2)`;
    ctx.lineWidth = 15;
    ctx.stroke();
};

export const drawFlowerVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const baseR = Math.min(w, h) * 0.1;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(hue * 0.01);
    
    const petals = 8;
    
    for(let i=0; i<bufferLength; i+=Math.floor(bufferLength/petals)) {
        const val = dataArray[i] / 255; // 0-1
        
        ctx.save();
        ctx.rotate((i / bufferLength) * Math.PI * 2);
        
        const petalLen = baseR + val * Math.min(w,h) * 0.3;
        const petalW = Math.min(w,h) * 0.05 + val * 20;
        
        ctx.fillStyle = `hsla(${hue + val * 60}, 80%, 60%, 0.8)`;
        ctx.beginPath();
        ctx.ellipse(petalLen/2, 0, petalLen/2, petalW, 0, 0, Math.PI*2);
        ctx.fill();
        
        // Inner detail
        if (val > 0.5) {
             ctx.fillStyle = '#fff';
             ctx.beginPath();
             ctx.arc(petalLen * 0.8, 0, 2, 0, Math.PI*2);
             ctx.fill();
        }
        
        ctx.restore();
    }
    
    // Center
    const centerPulse = (dataArray[0] / 255) * 10;
    ctx.fillStyle = `hsl(${hue + 180}, 100%, 80%)`;
    ctx.beginPath();
    ctx.arc(0, 0, baseR * 0.5 + centerPulse, 0, Math.PI*2);
    ctx.fill();
    
    ctx.restore();
};

export const drawDigitalRainVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const fontSize = 16;
    const cols = Math.floor(w / fontSize);
    
    ctx.font = `${fontSize}px monospace`;
    
    for(let i=0; i<cols; i++) {
        // Use column index + hue to simulate falling "drops" without persistent state
        // Pseudo-random speed per column
        const seed = i * 1337;
        const speed = 2 + (seed % 5); 
        
        const offset = (seed % h);
        const y = (hue * speed + offset) % h;
        
        // Audio reactivity: Brightness/Opacity based on freq bin
        const bin = Math.floor((i / cols) * bufferLength);
        const val = dataArray[bin] / 255;
        
        // Draw trail
        const trailLen = 10 + val * 20;
        
        for(let j=0; j<trailLen; j++) {
             const charY = y - (j * fontSize);
             if (charY < 0) continue;
             
             // Pseudo-random character based on y position so it changes as it falls
             const charCode = 0x30A0 + ((Math.floor(charY) + i) % 96); // Katakana
             const char = String.fromCharCode(charCode);
             
             const alpha = 1 - (j / trailLen);
             
             if (j === 0) {
                 ctx.fillStyle = '#fff'; // Head
             } else {
                 ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${alpha})`;
             }
             
             ctx.fillText(char, i * fontSize, charY);
        }
    }
};

// --- RL SKETCH VISUALIZERS ---

export const drawRLGridworldVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cols = 5;
    const rows = 5;
    const size = Math.min(w, h) * 0.6;
    const startX = (w - size) / 2;
    const startY = (h - size) / 2;
    const cellW = size / cols;
    const cellH = size / rows;
    
    const bass = dataArray[2] / 255;
    
    // Chalk/Marker style
    ctx.lineWidth = 2;
    ctx.strokeStyle = `hsla(${hue}, 80%, 80%, 0.8)`;
    ctx.setLineDash([15 + Math.random()*5, 5 + Math.random()*5]);
    
    // Grid
    for(let i=0; i<=cols; i++) {
        sketchLine(ctx, startX + i*cellW, startY, startX + i*cellW, startY + size);
    }
    for(let i=0; i<=rows; i++) {
        sketchLine(ctx, startX, startY + i*cellH, startX + size, startY + i*cellH);
    }
    
    ctx.setLineDash([]);
    
    // Agent (Moves vaguely with audio)
    const agentX = Math.floor((hue * 0.05) % cols);
    const agentY = Math.floor((hue * 0.03) % rows);
    
    const ax = startX + agentX * cellW + cellW/2;
    const ay = startY + agentY * cellH + cellH/2;
    
    ctx.strokeStyle = `hsla(${hue + 180}, 100%, 70%, 1)`;
    sketchCircle(ctx, ax, ay, cellW * 0.3 * (1 + bass * 0.5), 4);
    
    // Goal
    const gx = startX + (cols-1) * cellW + cellW/2;
    const gy = startY + (rows-1) * cellH + cellH/2;
    
    ctx.fillStyle = `hsla(120, 80%, 60%, 0.6)`;
    // Scribble Goal
    const gw = cellW * 0.6;
    sketchRect(ctx, gx - gw/2, gy - gw/2, gw, gw, 3);
};

export const drawPolicyArrowsVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cols = 10;
    const rows = 10;
    const cellW = w / cols;
    const cellH = h / rows;
    
    ctx.strokeStyle = `hsla(${hue}, 80%, 90%, 0.7)`;
    ctx.lineWidth = 2;
    
    for(let i=0; i<cols; i++) {
        for(let j=0; j<rows; j++) {
            const cx = i * cellW + cellW/2;
            const cy = j * cellH + cellH/2;
            
            // Perlin-ish noise for direction
            const angle = Math.sin(i * 0.3 + hue * 0.02) * Math.cos(j * 0.3 + hue * 0.02) * Math.PI * 2;
            
            const idx = (i * rows + j) % bufferLength;
            const val = dataArray[idx] / 255;
            
            const len = cellW * 0.4 * (0.5 + val);
            
            const x1 = cx - Math.cos(angle) * len;
            const y1 = cy - Math.sin(angle) * len;
            const x2 = cx + Math.cos(angle) * len;
            const y2 = cy + Math.sin(angle) * len;
            
            sketchArrow(ctx, x1, y1, x2, y2, len);
        }
    }
};

export const drawNeuralNetworkGraphVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const layers = [4, 6, 6, 3];
    const layerDist = w / (layers.length + 1);
    
    const nodes: {x: number, y: number}[] = [];
    
    // Generate Node Positions
    layers.forEach((count, lIdx) => {
        const x = layerDist * (lIdx + 1);
        const startY = (h - (count * 80)) / 2;
        for(let i=0; i<count; i++) {
            nodes.push({ x, y: startY + i * 80 });
        }
    });
    
    const bass = dataArray[5] / 255;
    
    // Edges
    ctx.strokeStyle = `hsla(${hue}, 50%, 80%, 0.2)`;
    ctx.lineWidth = 1;
    
    let nodeIdx = 0;
    layers.forEach((count, lIdx) => {
        if (lIdx === layers.length - 1) return;
        
        const currentLayerNodes = [];
        for(let i=0; i<count; i++) currentLayerNodes.push(nodes[nodeIdx + i]);
        
        const nextLayerCount = layers[lIdx+1];
        const nextLayerNodes = [];
        for(let i=0; i<nextLayerCount; i++) nextLayerNodes.push(nodes[nodeIdx + count + i]);
        
        currentLayerNodes.forEach((n1, i) => {
            nextLayerNodes.forEach((n2, j) => {
                const val = dataArray[(i * j * 10) % bufferLength] / 255;
                if (val > 0.3) {
                    ctx.strokeStyle = `hsla(${hue}, 50%, 80%, ${val * 0.5})`;
                    sketchLine(ctx, n1.x, n1.y, n2.x, n2.y, 1);
                    
                    // Energy Packet
                    if (val > 0.6) {
                        const t = (hue * 0.05 + i*0.1) % 1;
                        const ex = n1.x + (n2.x - n1.x) * t;
                        const ey = n1.y + (n2.y - n1.y) * t;
                        ctx.fillStyle = '#fff';
                        ctx.beginPath();
                        ctx.arc(ex + randomJitter(2), ey + randomJitter(2), 3, 0, Math.PI*2);
                        ctx.fill();
                    }
                }
            });
        });
        
        nodeIdx += count;
    });
    
    // Draw Nodes
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    nodes.forEach(n => {
        sketchCircle(ctx, n.x, n.y, 15 + bass * 5, 2);
    });
};

export const drawQTableHeatmapVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cols = 8;
    const rows = 8;
    const cellW = w / cols;
    const cellH = h / rows;
    
    for(let i=0; i<cols; i++) {
        for(let j=0; j<rows; j++) {
            const idx = (i * rows + j) % bufferLength;
            const qVal = dataArray[idx] / 255;
            
            const x = i * cellW;
            const y = j * cellH;
            
            // Cell Border
            ctx.strokeStyle = 'rgba(255,255,255,0.3)';
            sketchRect(ctx, x, y, cellW, cellH, 1);
            
            // Scribble Fill based on Q value
            if (qVal > 0.2) {
                const density = Math.floor(qVal * 10);
                ctx.strokeStyle = `hsla(${hue + qVal * 60}, 80%, 60%, 0.6)`;
                ctx.beginPath();
                for(let k=0; k<density; k++) {
                     const sx = x + Math.random() * cellW;
                     const sy = y + Math.random() * cellH;
                     const len = 10;
                     ctx.moveTo(sx, sy);
                     ctx.lineTo(sx + len, sy + len);
                }
                ctx.stroke();
            }
        }
    }
};

export const drawRobotOutlineVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const scale = Math.min(w, h) * 0.003;
    
    const bass = dataArray[5] / 255;
    
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    
    ctx.strokeStyle = `hsl(${hue}, 80%, 80%)`;
    ctx.lineWidth = 4;
    
    // Head
    sketchRect(ctx, -50, -150, 100, 80, 3);
    
    // Eyes
    const eyeGlow = bass * 10;
    sketchCircle(ctx, -25, -120, 10 + eyeGlow, 2);
    sketchCircle(ctx, 25, -120, 10 + eyeGlow, 2);
    
    // Antenna
    sketchLine(ctx, 0, -150, 0, -200 + randomJitter(5), 2);
    sketchCircle(ctx, 0, -200 + randomJitter(5), 10, 2);
    
    // Body
    sketchRect(ctx, -70, -60, 140, 150, 3);
    
    // Chest meter
    sketchRect(ctx, -40, -30, 80, 40, 2);
    const meterVal = (dataArray[20] / 255) * 80;
    ctx.fillStyle = `hsla(${hue + 120}, 100%, 60%, 0.5)`;
    ctx.fillRect(-40 + randomJitter(2), -30 + randomJitter(2), meterVal, 40);
    
    // Arms
    sketchLine(ctx, -70, -50, -120, 0 + randomJitter(10), 3); // Left
    sketchLine(ctx, 70, -50, 120, -50 + randomJitter(20) * bass, 3); // Right
    
    ctx.restore();
};

export const drawTigerStripesVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const stripes = 20;
    const step = h / stripes;
    
    ctx.lineWidth = 5;
    
    for(let i=0; i<stripes; i++) {
        const yBase = i * step;
        const val = dataArray[(i * 5) % bufferLength] / 255;
        
        ctx.strokeStyle = `hsla(${hue}, 80%, 60%, ${0.5 + val * 0.5})`;
        ctx.beginPath();
        
        let x = 0;
        ctx.moveTo(x, yBase);
        
        while(x < w) {
            x += 20;
            const noise = Math.sin(x * 0.01 + i + hue * 0.05) * 50 * (0.5 + val);
            const jitter = randomJitter(4);
            ctx.lineTo(x, yBase + noise + jitter);
        }
        
        ctx.stroke();
        
        // Sketchy overlay
        ctx.strokeStyle = 'rgba(255,255,255,0.3)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        x = 0;
        ctx.moveTo(x, yBase + 5);
        while(x < w) {
            x += 20;
            const noise = Math.sin(x * 0.01 + i + hue * 0.05) * 50 * (0.5 + val);
            ctx.lineTo(x, yBase + 5 + noise + randomJitter(6));
        }
        ctx.stroke();
    }
};

export const drawStateTransitionGraphVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    // Generate deterministic random nodes
    const nodeCount = 8;
    const nodes = [];
    for(let i=0; i<nodeCount; i++) {
        const angle = (i / nodeCount) * Math.PI * 2;
        const r = Math.min(w, h) * 0.3;
        nodes.push({
            x: w/2 + Math.cos(angle) * r,
            y: h/2 + Math.sin(angle) * r
        });
    }
    
    // Connections
    ctx.strokeStyle = `rgba(255,255,255,0.2)`;
    nodes.forEach((n1, i) => {
        nodes.forEach((n2, j) => {
            if (i !== j && (i+j)%3 === 0) {
                 sketchArrow(ctx, n1.x, n1.y, n2.x, n2.y, 20);
            }
        });
    });
    
    // Active Node (Jumps with audio)
    const activeIdx = Math.floor(dataArray[0] / 255 * nodeCount);
    const activeNode = nodes[activeIdx];
    
    // Highlight Active
    ctx.strokeStyle = `hsl(${hue}, 100%, 60%)`;
    sketchCircle(ctx, activeNode.x, activeNode.y, 30 + (dataArray[10]/255)*20, 5);
    
    // Nodes
    ctx.strokeStyle = '#fff';
    nodes.forEach(n => {
        sketchCircle(ctx, n.x, n.y, 10, 2);
    });
};

// --- NEW TOPIC-SPECIFIC VISUALIZERS ---

export const drawTokenLatticeVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    // Grid of small rectangles representing tokens in a transformer
    const cols = 20;
    const rows = 12;
    const cellW = w / cols;
    const cellH = h / rows;
    
    const bass = dataArray[5] / 255;

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            const idx = (i * rows + j) % bufferLength;
            const val = dataArray[idx] / 255;
            
            // Background dim block
            ctx.fillStyle = `hsla(${hue}, 50%, 20%, 0.3)`;
            ctx.fillRect(i * cellW + 2, j * cellH + 2, cellW - 4, cellH - 4);
            
            // Light up based on audio (simulating attention/activation)
            if (val > 0.4) {
                const alpha = (val - 0.4) * 1.6;
                ctx.fillStyle = `hsla(${hue + val * 60}, 100%, 60%, ${alpha})`;
                ctx.fillRect(i * cellW + 2, j * cellH + 2, cellW - 4, cellH - 4);
                
                // Text-like lines
                ctx.fillStyle = 'rgba(255,255,255,0.8)';
                ctx.fillRect(i * cellW + 5, j * cellH + 8, cellW * 0.6, 2);
                ctx.fillRect(i * cellW + 5, j * cellH + 14, cellW * 0.4, 2);
            }
        }
    }
    
    // Scanline (Attention Sweep)
    const scanRow = Math.floor((hue * 0.5) % rows);
    ctx.fillStyle = `hsla(${hue + 180}, 100%, 80%, 0.2)`;
    ctx.fillRect(0, scanRow * cellH, w, cellH);
};

export const drawAttentionMatrixVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    // Square Attention Matrix pattern
    const size = Math.min(w, h) * 0.7;
    const startX = (w - size) / 2;
    const startY = (h - size) / 2;
    const dim = 10;
    const cellS = size / dim;
    
    // Draw connections (attention weights)
    ctx.lineWidth = 1;
    for(let i=0; i<dim; i++) {
        for(let j=0; j<dim; j++) {
            // Audio value for this pair
            const idx = (i * dim + j) % bufferLength;
            const val = dataArray[idx] / 255;
            
            const x = startX + i * cellS;
            const y = startY + j * cellS;
            
            // Cell brightness
            const brightness = val * val * 100;
            ctx.fillStyle = `hsla(${hue}, 0%, ${brightness}%, ${val})`;
            ctx.fillRect(x, y, cellS, cellS);
            
            // Connections to other cells (simulated)
            if (val > 0.8) {
                ctx.strokeStyle = `hsla(${hue + 120}, 100%, 70%, 0.4)`;
                ctx.beginPath();
                ctx.moveTo(x + cellS/2, y + cellS/2);
                // Connect to a random-ish other cell driven by another freq bin
                const otherIdx = (idx + 50) % dim;
                const tx = startX + otherIdx * cellS + cellS/2;
                const ty = startY + (dim - 1 - i) * cellS + cellS/2;
                ctx.lineTo(tx, ty);
                ctx.stroke();
            }
        }
    }
    
    // Labels axis (abstract)
    ctx.fillStyle = '#fff';
    for(let i=0; i<dim; i++) {
        ctx.fillRect(startX - 10, startY + i*cellS + cellS/2, 5, 2);
        ctx.fillRect(startX + i*cellS + cellS/2, startY - 10, 2, 5);
    }
};

export const drawAgentSwarmVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const agentCount = 30;
    const cx = w / 2;
    const cy = h / 2;
    
    const bass = dataArray[5] / 255;
    
    // Simulated Boids/Agents
    for(let i=0; i<agentCount; i++) {
        // Pseudo-random motion based on time (hue) + index
        const t = hue * 0.05 + i;
        const radius = Math.min(w, h) * 0.3 * (1 + Math.sin(t * 0.3) * 0.5);
        const angle = t * 0.5 + (i / agentCount) * Math.PI * 2;
        
        // Bass repulsion
        const r = radius + bass * 100 * Math.sin(i * 13);
        
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        
        // Draw Agent (Triangle)
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle + Math.PI/2); // Point forward
        
        ctx.fillStyle = `hsl(${hue + i * 10}, 100%, 70%)`;
        ctx.beginPath();
        ctx.moveTo(0, -10);
        ctx.lineTo(8, 10);
        ctx.lineTo(0, 5); // Notch
        ctx.lineTo(-8, 10);
        ctx.closePath();
        ctx.fill();
        
        // Vision Cone (if active)
        const val = dataArray[i % bufferLength] / 255;
        if (val > 0.5) {
            ctx.fillStyle = `hsla(${hue}, 100%, 90%, 0.2)`;
            ctx.beginPath();
            ctx.moveTo(0, -10);
            ctx.lineTo(-20, -60);
            ctx.arc(0, -60, 20, Math.PI, 0); // Arc top
            ctx.lineTo(20, -60);
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
};

export const drawBouncingBlobsVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const blobCount = 5;
    
    for(let i=0; i<blobCount; i++) {
        // Pseudo-physics state
        const seed = i * 492;
        const speedX = Math.cos(seed) * 2;
        const speedY = Math.sin(seed) * 2;
        
        let x = (w/2) + Math.sin(hue * 0.01 * speedX) * (w * 0.4);
        let y = (h/2) + Math.cos(hue * 0.01 * speedY) * (h * 0.4);
        
        const idx = (i * 20) % bufferLength;
        const val = dataArray[idx] / 255;
        const baseR = Math.min(w, h) * 0.15;
        const r = baseR * (0.8 + val);
        
        ctx.fillStyle = `hsla(${hue + i * 60}, 100%, 60%, 0.7)`;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        
        // Draw Blob (Deformed Circle)
        ctx.beginPath();
        for (let a = 0; a < Math.PI * 2; a += 0.1) {
            const deform = Math.sin(a * 5 + hue * 0.1) * (val * 20);
            const px = x + Math.cos(a) * (r + deform);
            const py = y + Math.sin(a) * (r + deform);
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(x - r*0.3, y - r*0.1, r*0.25, 0, Math.PI*2);
        ctx.arc(x + r*0.3, y - r*0.1, r*0.25, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(x - r*0.3, y - r*0.1, r*0.1, 0, Math.PI*2);
        ctx.arc(x + r*0.3, y - r*0.1, r*0.1, 0, Math.PI*2);
        ctx.fill();
    }
};

export const drawBrainNetworkVisualizer = (ctx: VisualizerContext, dataArray: Uint8Array, bufferLength: number, w: number, h: number, hue: number) => {
    const cx = w / 2;
    const cy = h / 2;
    const rX = w * 0.25;
    const rY = h * 0.35;
    
    // Draw Brain Outline
    ctx.strokeStyle = `hsla(${hue}, 80%, 70%, 0.5)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rX, rY, 0, 0, Math.PI*2);
    ctx.stroke();
    
    // Hemispheres split
    ctx.beginPath();
    ctx.ellipse(cx - rX*0.2, cy, rX*0.6, rY*0.9, 0, 0, Math.PI*2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(cx + rX*0.2, cy, rX*0.6, rY*0.9, 0, 0, Math.PI*2);
    ctx.stroke();
    
    // Nodes inside
    const nodes = 50;
    for(let i=0; i<nodes; i++) {
        // Random pos inside brain
        const seed = i * 12.34;
        const angle = (seed % (Math.PI*2));
        const dist = Math.sqrt((seed * 100) % 1) * 0.9; // 0-1
        
        const px = cx + Math.cos(angle) * (rX * dist);
        const py = cy + Math.sin(angle) * (rY * dist);
        
        const val = dataArray[i*2 % bufferLength] / 255;
        
        // Draw Node
        ctx.fillStyle = `hsl(${hue + val * 120}, 100%, 70%)`;
        ctx.beginPath();
        ctx.arc(px, py, 3 + val * 5, 0, Math.PI*2);
        ctx.fill();
        
        // Fire synapse
        if (val > 0.6) {
             const target = (i + 15) % nodes; // deterministic target
             const seed2 = target * 12.34;
             const angle2 = (seed2 % (Math.PI*2));
             const dist2 = Math.sqrt((seed2 * 100) % 1) * 0.9;
             const tx = cx + Math.cos(angle2) * (rX * dist2);
             const ty = cy + Math.sin(angle2) * (rY * dist2);
             
             ctx.strokeStyle = `rgba(255,255,255,${val})`;
             ctx.beginPath();
             ctx.moveTo(px, py);
             ctx.lineTo(tx, ty);
             ctx.stroke();
        }
    }
};

export const drawTitleCard = (ctx: VisualizerContext, text: string, w: number, h: number, hue: number) => {
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    ctx.font = 'bold 64px Inter, sans-serif';
    ctx.fillStyle = 'white';
    ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
    ctx.shadowBlur = 30;
    
    const display = text.length > 45 ? text.substring(0, 45) + '...' : text;
    ctx.fillText(display, w / 2, h / 2);
    
    ctx.font = 'normal 32px Inter, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 15;
    ctx.fillText("AI Generated Podcast", w / 2, h / 2 + 80);
};

export const drawLogo = (ctx: VisualizerContext, logo: CanvasImageSource, w: number, h: number) => {
    // Target width: ~8% of screen width (Reduced from 15%)
    const targetW = w * 0.08;
    const padding = w * 0.02; // Reduced padding

    // Get natural dimensions with fallback, using 'any' cast to avoid TS union type errors
    const anyLogo = logo as any;
    const imgW = typeof anyLogo.width === 'number' ? anyLogo.width : anyLogo.naturalWidth || 100;
    const imgH = typeof anyLogo.height === 'number' ? anyLogo.height : anyLogo.naturalHeight || 100;

    const scale = targetW / imgW;
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    ctx.save();
    ctx.globalAlpha = 0.8;
    // Draw bottom right
    ctx.drawImage(logo, w - drawW - padding, h - drawH - padding, drawW, drawH);
    ctx.restore();
};

export const drawCaptions = (
    ctx: VisualizerContext, 
    caption: Caption, 
    currentTime: number, 
    w: number, 
    h: number,
    style: CaptionStyle,
    hue: number
  ) => {
    // Responsive font size based on minimum dimension to avoid massive text in portrait mode
    const fontSize = Math.floor(Math.min(w, h) * 0.06);
    
    const maxWidth = w * 0.85; 
    
    const lineHeight = fontSize * 1.5;
    
    const duration = caption.end - caption.start;
    const progress = Math.max(0, Math.min(1, (currentTime - caption.start) / duration));
    
    const words = caption.text.split(' ');
    const activeWordIndex = Math.min(words.length - 1, Math.floor(progress * words.length));

    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    
    // Multi-line Word Wrapping Logic
    let lines: { text: string; words: { text: string; active: boolean; idx: number }[] }[] = [];
    let currentLineWords: { text: string; active: boolean; idx: number }[] = [];
    let currentLineWidth = 0;
    let globalWordIdx = 0;
    
    for (let i = 0; i < words.length; i++) {
        const word = words[i];
        const wordWidth = ctx.measureText(word + " ").width;
        const isActive = globalWordIdx <= activeWordIndex;
        
        if (currentLineWidth + wordWidth < maxWidth) {
            currentLineWords.push({ text: word, active: isActive, idx: globalWordIdx });
            currentLineWidth += wordWidth;
        } else {
            lines.push({ text: "", words: currentLineWords });
            currentLineWords = [{ text: word, active: isActive, idx: globalWordIdx }];
            currentLineWidth = wordWidth;
        }
        globalWordIdx++;
    }
    lines.push({ text: "", words: currentLineWords });

    // Calculate Box Dimensions
    const boxPadding = style === 'boxed' ? fontSize * 0.6 : fontSize * 0.3;
    const boxHeight = lines.length * lineHeight;
    
    // Position near bottom
    const boxY = h - boxHeight - (h * 0.1); 
    
    // Calculate max width of actual text lines for a tight box
    const maxLineWidth = lines.reduce((max, line) => {
        const lw = line.words.reduce((acc, w) => acc + ctx.measureText(w.text + " ").width, 0);
        return Math.max(max, lw);
    }, 0);
    
    const finalBoxWidth = maxLineWidth + (boxPadding * 4); // Extra horizontal padding
    const finalBoxHeight = boxHeight + (boxPadding * 2);
    const boxX = (w - finalBoxWidth) / 2;

    // Background (Always 75% Black for readability)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)'; 
    ctx.shadowColor = style === 'boxed' ? `hsl(${hue}, 100%, 50%)` : 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = style === 'boxed' ? 20 : 10;

    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(boxX, boxY, finalBoxWidth, finalBoxHeight, 16);
    } else {
        ctx.fillRect(boxX, boxY, finalBoxWidth, finalBoxHeight);
    }
    ctx.fill();
    ctx.shadowBlur = 0; 

    // Draw Text
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Speaker Label (Above box)
    if (style !== 'minimal') {
      ctx.fillStyle = `hsl(${(hue+180)%360}, 100%, 70%)`; 
      ctx.font = `bold ${fontSize * 0.6}px Inter, sans-serif`;
      ctx.shadowColor = 'rgba(0,0,0,0.8)';
      ctx.shadowBlur = 4;
      ctx.fillText(caption.speaker.toUpperCase(), w / 2, boxY - (fontSize * 0.8));
      ctx.shadowBlur = 0;
    }

    // Render Lines
    lines.forEach((line, lineIdx) => {
        const y = boxY + boxPadding + (lineIdx * lineHeight) + (lineHeight/2) - (fontSize * 0.2); // Center vertically in line
        
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        const totalLineWidth = line.words.reduce((acc, w) => acc + ctx.measureText(w.text + " ").width, 0);
        let startX = (w - totalLineWidth) / 2;

        line.words.forEach((wordObj) => {
            const isCurrent = wordObj.idx === activeWordIndex;
            let currentScale = 1.0;
            let color = 'rgba(255,255,255,0.7)'; 

            if (isCurrent) {
                 color = `hsl(${hue}, 100%, 70%)`; 
                 currentScale = 1.15; 
                 ctx.font = `bold ${fontSize * currentScale}px Inter, sans-serif`;
                 ctx.shadowColor = `hsl(${hue}, 100%, 50%)`;
                 ctx.shadowBlur = 15;
            } else if (wordObj.active) {
                 color = '#ffffff';
                 ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                 ctx.shadowBlur = 0;
            } else {
                 ctx.font = `bold ${fontSize}px Inter, sans-serif`;
                 ctx.shadowBlur = 0;
            }

            if (style === 'karaoke') {
                if (!wordObj.active) color = 'rgba(255,255,255,0.25)';
            }
            
            ctx.fillStyle = color;
            const wordWidth = ctx.measureText(wordObj.text + " ").width;
            const drawX = startX + (wordWidth/2);
            
            ctx.fillText(wordObj.text, drawX, y); 
            
            ctx.shadowBlur = 0;
            startX += wordWidth;
        });
    });
};

export const rlSketchVisualizers = [
  "drawRLGridworldVisualizer",
  "drawPolicyArrowsVisualizer",
  "drawNeuralNetworkGraphVisualizer",
  "drawQTableHeatmapVisualizer",
  "drawRobotOutlineVisualizer",
  "drawTigerStripesVisualizer",
  "drawStateTransitionGraphVisualizer"
];
