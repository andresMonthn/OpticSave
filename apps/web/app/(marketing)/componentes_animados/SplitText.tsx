"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
}

export default function SplitText({
  text,
  className = "",
  delay = 0.03,
  duration = 0.4,
}: SplitTextProps) {
  const letters = useMemo(() => text.split(""), [text]);

  return (
    <span className={`inline-block ${className}`}>
      {letters.map((char, i) => (
        <motion.span
          key={i}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: i * delay, duration }}
          className="inline-block"
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}
