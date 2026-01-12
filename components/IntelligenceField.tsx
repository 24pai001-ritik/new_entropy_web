import React, { useMemo, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const IntelligenceField: React.FC = () => {
  const { scrollYProgress } = useScroll();
  
  // High-fidelity parallax and depth
  const zScale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  const zOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [0.6, 0.8, 0.5]);

  const springX = useSpring(0, { stiffness: 60, damping: 40 });
  const springY = useSpring(0, { stiffness: 60, damping: 40 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      springX.set((e.clientX / window.innerWidth - 0.5) * 50);
      springY.set((e.clientY / window.innerHeight - 0.5) * 50);
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [springX, springY]);

  const particles = useMemo(() => Array.from({ length: 40 }).map((_, i) => ({
    id: i,
    size: Math.random() * 2 + 1,
    x: Math.random() * 100,
    y: Math.random() * 100,
    speed: 20 + Math.random() * 40,
    opacity: 0.1 + Math.random() * 0.2
  })), []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden bg-[#030507]">
      {/* Structural Data Streaks */}
      <motion.div 
        style={{ scale: zScale, opacity: zOpacity, x: springX, y: springY }}
        className="absolute inset-0"
      >
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ y: "110%", opacity: 0 }}
            animate={{ 
              y: "-10%",
              opacity: [0, p.opacity, 0],
            }}
            transition={{
              duration: p.speed,
              repeat: Infinity,
              ease: "linear",
              delay: p.id * -2
            }}
            className="absolute bg-[#4FD1FF] rounded-full blur-[1px]"
            style={{ 
              width: '1px', 
              height: `${Math.random() * 100 + 50}px`,
              left: `${p.x}%`,
              opacity: p.opacity
            }}
          />
        ))}
      </motion.div>

      {/* Hero Glows */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#4FD1FF] opacity-[0.03] blur-[150px] rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#8B5CF6] opacity-[0.03] blur-[150px] rounded-full" />
    </div>
  );
};

export default IntelligenceField;