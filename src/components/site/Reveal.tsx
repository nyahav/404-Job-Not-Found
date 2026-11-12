import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MOTION_DURATION, MOTION_EASE } from './motion';

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export default function Reveal({ children, className, delay = 0 }: RevealProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      initial={reduceMotion ? false : { opacity: 0, y: 20 }}
      transition={{ duration: MOTION_DURATION.slow, delay, ease: MOTION_EASE }}
      viewport={{ once: true, amount: 0.16 }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      {children}
    </motion.div>
  );
}
