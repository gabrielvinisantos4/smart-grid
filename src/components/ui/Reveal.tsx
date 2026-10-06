import { motion, type HTMLMotionProps } from 'motion/react';
import { MOTION } from '@/config/site';

interface RevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
  y?: number;
}

/** Fade + slide-up suave quando o elemento entra na tela. */
export function Reveal({ delay = 0, y = 28, children, ...props }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: MOTION.duration, ease: MOTION.ease, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
