import { useScrollAnimation } from "../../hooks/useScrollAnimation";

export default function SplitText({ text, delay = 0 }) {
  const { ref, isVisible, reducedMotion } = useScrollAnimation(null, { resetKey: text });
  const words = text.split(" ");

  return (
    <span ref={ref} className="inline" aria-label={text}>
      {words.map((word, index) => (
        <span
          key={`${word}-${index}`}
          aria-hidden="true"
          className={`split-word ${isVisible ? "split-word--visible" : ""}`}
          style={{ transitionDelay: reducedMotion ? "0ms" : `${delay + index * 60}ms` }}
        >
          {word}{index < words.length - 1 ? " " : ""}
        </span>
      ))}
    </span>
  );
}
