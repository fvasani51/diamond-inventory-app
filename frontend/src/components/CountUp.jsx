import { useEffect, useRef, useState } from "react";

/**
 * Animates a number counting up from 0 to `value` on mount.
 * `format` receives the current (rounded) number and returns the display string.
 */
export default function CountUp({ value = 0, duration = 900, format = (n) => n.toLocaleString() }) {
  const [display, setDisplay] = useState(0);
  const frameRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplay(Math.round(from + (to - from) * eased));
      if (progress < 1) frameRef.current = requestAnimationFrame(tick);
    }
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [value, duration]);

  return <>{format(display)}</>;
}