
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useAnimation, useScroll, useTransform, AnimatePresence, useVelocity, useSpring } from 'framer-motion';

interface Logo3DProps {
  size?: number;
  triggerLoop?: boolean;
}

const Shard: React.FC<{ index: number; controls: any; size: number; isHovered: boolean }> = ({ index, controls, size, isHovered }) => {
  const shapes = [
    "polygon(50% 0%, 100% 38%, 81% 100%, 19% 100%, 0% 38%)",
    "polygon(25% 0%, 100% 0%, 75% 100%, 0% 100%)",
    "polygon(0% 15%, 100% 0%, 85% 100%, 15% 85%)",
    "polygon(50% 0%, 100% 100%, 0% 100%)",
  ];

  const colors = [
    "linear-gradient(135deg, #4FD1FF 0%, #3B6DFF 100%)",
    "linear-gradient(135deg, #3B6DFF 0%, #8B5CF6 100%)",
    "linear-gradient(135deg, #4FD1FF 0%, #8B5CF6 100%)",
  ];

  // Fix: Move initial calculation out of the prop to avoid type mismatch as 'initial' does not directly accept functions
  const initialProps = useMemo(() => {
    const angle = Math.random() * Math.PI * 2;
    const radius = size * (1.5 + Math.random() * 1.5);
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotate: Math.random() * 2000,
      opacity: 0,
      scale: 0.1,
    };
  }, [size]);

  return (
    <motion.div
      custom={index}
      animate={controls}
      initial={initialProps}
      className="absolute"
      style={{
        width: size * 0.08,
        height: size * 0.08,
        left: '50%',
        top: '50%',
        marginLeft: -(size * 0.04),
        marginTop: -(size * 0.04),
        background: colors[index % colors.length],
        clipPath: shapes[index % shapes.length],
        boxShadow: isHovered ? '0 0 40px rgba(79,209,255,0.8)' : '0 0 10px rgba(79,209,255,0.1)',
        filter: isHovered ? 'brightness(1.5) blur(0px)' : 'brightness(1.1) blur(1.5px)',
        zIndex: 1,
      }}
    />
  );
};

// Generative RL Policy Path component
const PolicyPath: React.FC<{ size: number }> = ({ size }) => {
  const pathPoints = useMemo(() => {
    const points = [];
    const count = 12;
    for (let i = 0; i <= count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = (size * 0.25) + (Math.random() - 0.5) * (size * 0.1);
      points.push(`${Math.cos(angle) * r},${Math.sin(angle) * r}`);
    }
    return `M ${points.join(' L ')} Z`;
  }, [size]);

  return (
    <motion.svg 
      viewBox={`-${size/2} -${size/2} ${size} ${size}`} 
      className="absolute inset-0 z-20 pointer-events-none"
      animate={{ rotate: 360 }}
      transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
    >
      <motion.path
        d={pathPoints}
        fill="none"
        stroke="#4FD1FF"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ 
          pathLength: [0, 1, 1], 
          opacity: [0, 0.8, 0.5],
          d: [pathPoints, pathPoints.split(' ').reverse().join(' '), pathPoints]
        }}
        transition={{ 
          pathLength: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          d: { duration: 10, repeat: Infinity, ease: "easeInOut" }
        }}
        style={{ filter: 'drop-shadow(0 0 8px #4FD1FF)' }}
      />
    </motion.svg>
  );
};

const Logo3D: React.FC<Logo3DProps> = ({ size = 300, triggerLoop = false }) => {
  const shardsCount = 18;
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);
  const { scrollY } = useScroll();
  
  // Velocity reactions: The logo leads the travel journey
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping: 50, stiffness: 300 });
  
  const velocityRotation = useTransform(smoothVelocity, [-2000, 2000], [-50, 50]);
  const velocityGlow = useTransform(smoothVelocity, [-2000, 2000], [0.8, 3]);
  const velocityScale = useTransform(smoothVelocity, [-2000, 2000], [0.9, 1.3]);

  const rotateY = useTransform(scrollY, [0, 3000], [0, 60]);
  const rotateX = useTransform(scrollY, [0, 3000], [0, -30]);
  const driftY = useTransform(scrollY, [0, 3000], [0, -200]);

  const runEntropySnap = useCallback(async (isInitial = false) => {
    await controls.start((i) => ({
      x: (Math.random() - 0.5) * size * (isInitial ? 6 : 3),
      y: (Math.random() - 0.5) * size * (isInitial ? 6 : 3),
      rotate: Math.random() * (isInitial ? 5000 : 1080),
      opacity: isInitial ? 0 : 0.3,
      scale: isInitial ? 0 : 0.4,
      transition: { duration: isInitial ? 0 : 0.8, ease: "circOut" }
    }));

    await controls.start((i) => {
      const angle = (i / shardsCount) * Math.PI * 2;
      const radius = size * 0.38;
      return {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        rotate: (i / shardsCount) * 360,
        opacity: 0.95,
        scale: 1,
        transition: { 
          duration: isInitial ? 3.5 : 1.4, 
          delay: isInitial ? 0.6 : 0,
          ease: [0.16, 1, 0.3, 1] 
        }
      };
    });
  }, [controls, size, shardsCount]);

  useEffect(() => {
    runEntropySnap(true);
    if (triggerLoop) {
      const interval = setInterval(() => runEntropySnap(), 15000);
      return () => clearInterval(interval);
    }
  }, [triggerLoop, runEntropySnap]);

  return (
    <motion.div 
      className="relative flex items-center justify-center cursor-pointer group" 
      style={{ 
        width: size, 
        height: size, 
        rotateY, 
        rotateX, 
        y: driftY, 
        scale: useSpring(useTransform(scrollY, [0, 2000], [1, 0.75]), { stiffness: 50, damping: 20 }), 
        rotate: velocityRotation 
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        runEntropySnap(false);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Environment Aura (Reacts to Travel Velocity) */}
      <motion.div
        className="absolute w-full h-full rounded-full bg-gradient-to-br from-[#4FD1FF]/30 via-transparent to-[#8B5CF6]/15 blur-[250px]"
        style={{ scale: velocityGlow }}
        animate={{ opacity: [0.4, 0.8, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2. Intelligence Halo */}
      <motion.div
        className="absolute w-[95%] h-[95%] rounded-full bg-gradient-to-br from-[#4FD1FF]/60 via-[#3B6DFF]/30 to-[#8B5CF6]/50 blur-[150px]"
        animate={{ 
          opacity: isHovered ? [0.9, 1, 0.9] : [0.5, 0.8, 0.5],
          scale: isHovered ? [1.2, 1.5, 1.2] : [1, 1.2, 1],
          rotate: [0, 360]
        }}
        transition={{ 
          opacity: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 60, repeat: Infinity, ease: "linear" }
        }}
      />

      <PolicyPath size={size} />

      {/* 3. Neural Shard Cloud */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{ rotate: isHovered ? 360 : -360 }}
        transition={{ duration: isHovered ? 18 : 120, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: shardsCount }).map((_, i) => (
          <Shard key={i} index={i} controls={controls} size={size} isHovered={isHovered} />
        ))}
      </motion.div>

      {/* 4. Identity Core (Central Intelligence Node) */}
      <motion.div
        className="relative z-10 w-80 h-80 flex flex-col items-center justify-center rounded-full overflow-hidden glass shadow-[0_0_150px_rgba(0,0,0,1)]"
        style={{ scale: velocityScale }}
        initial={{ opacity: 0, scale: 0, filter: 'blur(70px)' }}
        animate={{ 
          opacity: 1, 
          scale: isHovered ? 1.2 : 1, 
          filter: 'blur(0px)',
          boxShadow: isHovered ? '0 0 150px rgba(79,209,255,0.7)' : '0 0 80px rgba(0,0,0,0.8)'
        }}
        transition={{ 
          opacity: { duration: 2, delay: 1.2 },
          scale: { duration: 1.5, ease: "circOut" },
          filter: { duration: 2, delay: 1.2 }
        }}
      >
        <div className="absolute inset-0 bg-[#080A0F]/98 backdrop-blur-3xl border border-white/20 rounded-full" />
        
        {/* Living Identity Sync with entropy_logo.png */}
        <motion.img 
          src="entropy_logo.png" 
          alt="Entropy Logo Core"
          className="w-48 h-48 object-contain relative z-10 brightness-110 drop-shadow-[0_0_40px_rgba(79,209,255,0.7)]"
          animate={{
            y: [0, -10, 0],
            rotate: isHovered ? [0, 5, -5, 0] : 0,
            filter: isHovered ? 'brightness(1.4) drop-shadow(0 0 60px rgba(79,209,255,0.9))' : 'brightness(1.1) drop-shadow(0 0 30px rgba(79,209,255,0.5))'
          }}
          transition={{
            y: { duration: 8, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            filter: { duration: 0.8 }
          }}
          onError={(e) => {
              e.currentTarget.style.display = 'none';
              const parent = e.currentTarget.parentElement;
              if (parent && !parent.querySelector('.fallback-core')) {
                  const fallback = document.createElement('div');
                  fallback.className = 'fallback-core text-9xl font-black text-white/95 z-10 drop-shadow-[0_0_40px_rgba(79,209,255,0.8)]';
                  fallback.innerText = 'Σ';
                  parent.appendChild(fallback);
              }
          }}
        />

        {/* Neural Scanning Orbits */}
        <motion.div 
          className="absolute inset-0 border-[10px] border-[#4FD1FF]/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
        />
        <motion.div 
          className="absolute inset-[15%] border-[3px] border-[#8B5CF6]/30 rounded-full border-dotted"
          animate={{ rotate: 360 }}
          transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
        />

        <div className="absolute bottom-16 z-20 w-full text-center px-4">
          <motion.div 
            animate={isHovered ? { letterSpacing: '1.2em', scale: 1.1 } : { letterSpacing: '0.8em', scale: 1 }}
            className="text-[9px] font-black text-white uppercase opacity-100 drop-shadow-[0_0_15px_rgba(79,209,255,1)]"
          >
            Entropy Node
          </motion.div>
        </div>
      </motion.div>
      
      {/* 5. Traveling Data Streaks */}
      <AnimatePresence>
        {(isHovered || triggerLoop) && Array.from({ length: 30 }).map((_, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, scale: 0, z: -1000 }}
            animate={{ 
                opacity: [0, 1, 0],
                x: (Math.random() - 0.5) * size * 3.5,
                y: (Math.random() - 0.5) * size * 3.5,
                z: [ -1000, 1000 ],
                scale: [0, 4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{ 
                duration: 2 + Math.random() * 5, 
                repeat: Infinity, 
                delay: Math.random() * 5 
            }}
            className="absolute w-2 h-2 bg-[#4FD1FF] rounded-full blur-[4px]"
            style={{ top: '50%', left: '50%' }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default Logo3D;
