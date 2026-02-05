import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';

interface Logo3DProps {
  size?: number;
  triggerLoop?: boolean;
}

const Shard: React.FC<{ index: number; controls: any; size: number; isHovered: boolean }> = React.memo(({ index, controls, size, isHovered }) => {
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

  const initialProps = useMemo(() => {
    // Use deterministic positioning based on index for consistency
    const angle = (index / 14) * Math.PI * 2; // Assumes shardsCount = 14
    const radius = size * 3;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      rotate: index * 100,
      opacity: 0,
      scale: 0.1,
    };
  }, [size, index]);

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
        boxShadow: isHovered ? '0 0 30px rgba(79,209,255,0.8)' : '0 0 15px rgba(79,209,255,0.4)',
        filter: 'brightness(1.3)',
        zIndex: 1,
        willChange: 'transform',
      }}
    />
  );
});

Shard.displayName = 'Shard';

// Simplified Policy Path component
const PolicyPath: React.FC<{ size: number }> = React.memo(({ size }) => {
  const pathPoints = useMemo(() => {
    const points = [];
    const count = 8; // Reduced from 12
    for (let i = 0; i <= count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = size * 0.25;
      points.push(`${Math.cos(angle) * r},${Math.sin(angle) * r}`);
    }
    return `M ${points.join(' L ')} Z`;
  }, [size]);

  return (
    <motion.svg
      viewBox={`-${size / 2} -${size / 2} ${size} ${size}`}
      className="absolute inset-0 z-20 pointer-events-none"
      animate={{ rotate: 360 }}
      transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
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
          pathLength: [0, 1],
          opacity: [0, 0.6],
        }}
        transition={{
          pathLength: { duration: 3, repeat: Infinity, ease: "easeInOut" },
          opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" },
        }}
        style={{ filter: 'drop-shadow(0 0 6px #4FD1FF)' }}
      />
    </motion.svg>
  );
});

PolicyPath.displayName = 'PolicyPath';

const Logo3D: React.FC<Logo3DProps> = ({ size = 300, triggerLoop = false }) => {
  const shardsCount = 14; // Increased from 8
  const controls = useAnimation();
  const [isHovered, setIsHovered] = useState(false);

  const runEntropySnap = useCallback(async (isInitial = false) => {
    // Deterministic explosion pattern
    await controls.start((i) => {
      const explosionAngle = (i / shardsCount) * Math.PI * 2 + Math.PI / 4;
      const explosionRadius = size * (isInitial ? 3 : 1.5);
      return {
        x: Math.cos(explosionAngle) * explosionRadius,
        y: Math.sin(explosionAngle) * explosionRadius,
        rotate: i * (isInitial ? 360 : 180),
        opacity: isInitial ? 0 : 0.3,
        scale: isInitial ? 0 : 0.4,
        transition: { duration: isInitial ? 0 : 0.8, ease: "circOut" }
      };
    });

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
        transform: 'translateZ(0)', // GPU acceleration
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        runEntropySnap(false);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. Environment Aura */}
      <motion.div
        className="absolute w-full h-full rounded-full bg-gradient-to-br from-[#4FD1FF]/30 via-transparent to-[#8B5CF6]/15 blur-[200px]"
        animate={{ opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* 2. Intelligence Halo */}
      <motion.div
        className="absolute w-[90%] h-[90%] rounded-full bg-gradient-to-br from-[#4FD1FF]/50 via-[#3B6DFF]/25 to-[#8B5CF6]/40 blur-[120px]"
        animate={{
          opacity: isHovered ? [0.8, 1, 0.8] : [0.4, 0.7, 0.4],
          scale: isHovered ? [1.1, 1.3, 1.1] : [1, 1.15, 1],
          rotate: [0, 360]
        }}
        transition={{
          opacity: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          scale: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 50, repeat: Infinity, ease: "linear" }
        }}
      />

      <PolicyPath size={size} />

      {/* 3. Neural Shard Cloud */}
      <motion.div
        className="absolute inset-0 z-30"
        animate={{ rotate: isHovered ? 360 : -360 }}
        transition={{ duration: isHovered ? 20 : 100, repeat: Infinity, ease: "linear" }}
      >
        {Array.from({ length: shardsCount }).map((_, i) => (
          <Shard key={i} index={i} controls={controls} size={size} isHovered={isHovered} />
        ))}
      </motion.div>

      {/* 4. Identity Core */}
      <motion.div
        className="relative z-10 w-80 h-80 flex flex-col items-center justify-center rounded-full overflow-hidden glass shadow-[0_0_100px_rgba(0,0,0,0.8)]"
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: isHovered ? 1.15 : 1,
        }}
        transition={{
          opacity: { duration: 1.5, delay: 0.8 },
          scale: { duration: 1, ease: "circOut" },
        }}
      >
        <div className="absolute inset-0 bg-[#080A0F]/98 backdrop-blur-2xl border border-white/20 rounded-full" />

        {/* Living Identity */}
        <motion.img
          src="entropy_logo.png"
          alt="Entropy Logo Core"
          className="w-48 h-48 object-contain relative z-10 brightness-110 drop-shadow-[0_0_30px_rgba(79,209,255,0.6)]"
          animate={{
            y: [0, -8, 0],
            rotate: isHovered ? [0, 4, -4, 0] : 0,
          }}
          transition={{
            y: { duration: 6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 5, repeat: Infinity, ease: "easeInOut" },
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const parent = e.currentTarget.parentElement;
            if (parent && !parent.querySelector('.fallback-core')) {
              const fallback = document.createElement('div');
              fallback.className = 'fallback-core text-9xl font-black text-white/95 z-10 drop-shadow-[0_0_30px_rgba(79,209,255,0.7)]';
              fallback.innerText = 'Σ';
              parent.appendChild(fallback);
            }
          }}
        />

        {/* Neural Scanning Orbits */}
        <motion.div
          className="absolute inset-0 border-[8px] border-[#4FD1FF]/10 rounded-full"
          animate={{ rotate: -360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        />
        <motion.div
          className="absolute inset-[15%] border-[2px] border-[#8B5CF6]/25 rounded-full border-dotted"
          animate={{ rotate: 360 }}
          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
        />

        <div className="absolute bottom-16 z-20 w-full text-center px-4">
          <motion.div
            animate={isHovered ? { letterSpacing: '1.1em', scale: 1.05 } : { letterSpacing: '0.8em', scale: 1 }}
            className="text-[9px] font-black text-white uppercase opacity-100 drop-shadow-[0_0_12px_rgba(79,209,255,0.9)]"
          >
            Entropy Node
          </motion.div>
        </div>
      </motion.div>

      {/* 5. Traveling Data Streaks - Only on hover, reduced count */}
      <AnimatePresence>
        {isHovered && Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              x: (Math.random() - 0.5) * size * 2.5,
              y: (Math.random() - 0.5) * size * 2.5,
              scale: [0, 4, 0],
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 2 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 2
            }}
            className="absolute w-2 h-2 bg-[#4FD1FF] rounded-full blur-[2px]"
            style={{ top: '50%', left: '50%', zIndex: 50 }}
          />
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default React.memo(Logo3D);
