import { motion } from "motion/react";
import { easeOutExpo } from "../../lib/motion";

/**
 * React Bits-style SplitText: each character rises out of a mask with a blur.
 * Words are kept intact so lines never break mid-word.
 */
export function SplitText({
  text,
  className = "",
  delay = 0,
  stagger = 0.028,
  inView = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  /** Animate when scrolled into view instead of on mount. */
  inView?: boolean;
}) {
  const words = text.split(" ");
  let index = 0;
  const trigger = inView
    ? { initial: "hidden", whileInView: "show", viewport: { once: true, amount: 0.6 } }
    : { initial: "hidden", animate: "show" };

  return (
    <motion.span {...trigger} aria-label={text} className="inline">
      {words.map((word, w) => (
        <span key={w} aria-hidden className="inline-block whitespace-nowrap">
          {[...word].map((ch) => {
            const i = index++;
            return (
              <span key={i} className="inline-block overflow-hidden pb-[.12em] -mb-[.12em] align-bottom">
                <motion.span
                  className={`inline-block ${className}`}
                  variants={{
                    hidden: { y: "105%", opacity: 0, filter: "blur(10px)" },
                    show: {
                      y: "0%",
                      opacity: 1,
                      filter: "blur(0px)",
                      transition: { duration: 0.9, ease: easeOutExpo, delay: delay + i * stagger },
                    },
                  }}
                >
                  {ch}
                </motion.span>
              </span>
            );
          })}
          {w < words.length - 1 && <span className="inline-block">&nbsp;</span>}
        </span>
      ))}
    </motion.span>
  );
}
