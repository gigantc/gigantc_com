import { useId } from 'react';
import './MoonIcon.scss';

// Fixed pseudo-random crater layout so the moon looks like the moon,
// not a texture that shifts each render.
const CRATERS = [
  { cx: 32, cy: 30, r: 6 },
  { cx: 55, cy: 22, r: 4 },
  { cx: 72, cy: 42, r: 8 },
  { cx: 42, cy: 55, r: 5 },
  { cx: 26, cy: 62, r: 4 },
  { cx: 60, cy: 72, r: 6 },
  { cx: 78, cy: 68, r: 3 },
  { cx: 48, cy: 78, r: 3 },
];

const MoonIcon = ({ illumination, waxing, size = 110 }) => {
  const clipId = useId();
  const r = size / 2;
  const cx = r;
  const K = illumination / 100;
  // Terminator ellipse x-radius. At K=0 or K=1 it equals r (matches disc edge).
  // At K=0.5 it collapses to 0 (straight-line terminator).
  const ex = r * Math.abs(1 - 2 * K);
  const isGibbous = K > 0.5;

  // Build the path for the LIT region. See moon-phase geometry notes:
  // half of the disc semicircle on the lit side + half of the terminator ellipse.
  const discSweep = waxing ? 1 : 0;
  const ellipseSweep = isGibbous === waxing ? 1 : 0;
  const path = `M ${cx},0 A ${r},${r} 0 0,${discSweep} ${cx},${size} A ${ex},${r} 0 0,${ellipseSweep} ${cx},0 Z`;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="moonIcon"
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <circle cx={cx} cy={r} r={r} className="shadowDisc" />
      <path d={path} className="litDisc" />
      <g clipPath={`url(#${clipId})`} className="craters">
        {CRATERS.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r={c.r} />
        ))}
      </g>
    </svg>
  );
};

export default MoonIcon;
