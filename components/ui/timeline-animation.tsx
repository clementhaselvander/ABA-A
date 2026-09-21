"use client";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";

type Props = HTMLMotionProps<"article"> & { animationNum?: number };
export function TimelineContent({ animationNum = 0, children, ...props }: Props) {
  const reduced = useReducedMotion();
  return <motion.article {...props}
    initial={reduced ? false : { opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : animationNum * 0.12 }}
  >{children}</motion.article>;
}
