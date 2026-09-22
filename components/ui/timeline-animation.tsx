"use client";
import { motion, useInView, useReducedMotion, type HTMLMotionProps, type Variants } from "motion/react";
import { useRef, type RefObject } from "react";

const tags = {
  article: motion.article, section: motion.section, div: motion.div, span: motion.span,
  p: motion.p, h1: motion.h1, h2: motion.h2, h3: motion.h3, h4: motion.h4, li: motion.li,
} as const;

type Props = HTMLMotionProps<"article"> & {
  animationNum?: number;
  /** Element to render. Defaults to `article`, which is what the membership cards use. */
  as?: keyof typeof tags;
  /** Reveal every sibling together once this container scrolls into view. */
  timelineRef?: RefObject<Element | null>;
  /** Variants keyed `hidden`/`visible`, receiving `animationNum` as the custom value. */
  customVariants?: Variants;
};

export function TimelineContent({ animationNum = 0, as, timelineRef, customVariants, children, ...props }: Props) {
  const reduced = useReducedMotion();
  // Cast through `unknown`: motion types each tag separately, but every tag here
  // accepts the HTMLMotionProps we forward.
  const Tag = tags[as ?? "article"] as unknown as typeof motion.article;
  const fallbackRef = useRef<Element>(null);
  const scopeInView = useInView(timelineRef ?? fallbackRef, { once: true, amount: 0.1 });

  if (customVariants) {
    return <Tag {...props}
      custom={animationNum}
      variants={customVariants}
      initial={reduced ? false : "hidden"}
      {...(timelineRef
        ? { animate: reduced || scopeInView ? "visible" : "hidden" }
        : { whileInView: "visible", viewport: { once: true, amount: 0.12 } })}
    >{children}</Tag>;
  }

  return <Tag {...props}
    initial={reduced ? false : { opacity: 0, y: 16 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.12 }}
    transition={{ duration: reduced ? 0 : 0.7, delay: reduced ? 0 : animationNum * 0.12 }}
  >{children}</Tag>;
}
