import { STAGES } from './lib/core';

export default function Plant({ type, stage, size = 200 }) {
  const green = '#4c9a6a', h = [0, 22, 40, 54, 64][stage], y = 104 - h;
  const petals = (n, c) => Array.from({ length: n }, (_, i) => {
    const a = (i * 2 * Math.PI) / n, cx = 60 + Math.cos(a) * 11, cy = y - 6 + Math.sin(a) * 11;
    return <ellipse key={i} cx={cx} cy={cy} rx="8" ry="4.5" fill={c} transform={`rotate(${a * 57.3} ${cx} ${cy})`} />;
  });
  let body;
  if (stage === 0) body = <ellipse cx="60" cy="100" rx="8" ry="5" fill="#8a6a4f" />;
  else if (type === 'cactus') body = (<>
    <rect x="48" y={y - 4} width="24" height={h + 4} rx="12" fill={green} />
    {stage > 1 && <><rect x="34" y={y + 14} width="9" height="20" rx="4.5" fill={green} /><rect x="77" y={y + 8} width="9" height="22" rx="4.5" fill={green} /></>}
    {stage > 2 && <circle cx="60" cy={y - 6} r={stage === 4 ? 7 : 4} fill="#e28fae" />}
  </>);
  else if (type === 'bonsai') { const r = [0, 9, 15, 20, 25][stage]; body = (<>
    <path d={`M56 104 Q58 ${y + 20} 64 ${y}`} stroke="#7a5638" strokeWidth="7" fill="none" strokeLinecap="round" />
    <circle cx="62" cy={y - 2} r={r} fill={green} />
    {stage > 1 && <><circle cx={62 - r * 0.8} cy={y + 6} r={r * 0.65} fill="#5fae7c" /><circle cx={62 + r * 0.8} cy={y + 4} r={r * 0.7} fill="#3f8a5c" /></>}
    {stage === 4 && <><circle cx="70" cy={y - 12} r="3" fill="#f2b6c8" /><circle cx="52" cy={y - 4} r="3" fill="#f2b6c8" /></>}
  </>); }
  else { const sun = type === 'sunflower'; body = (<>
    <path d={`M60 104 V${y}`} stroke={green} strokeWidth="5" strokeLinecap="round" />
    <ellipse cx="48" cy={y + h * 0.5} rx="11" ry="5" fill={green} transform={`rotate(-25 48 ${y + h * 0.5})`} />
    <ellipse cx="72" cy={y + h * 0.35} rx="11" ry="5" fill={green} transform={`rotate(25 72 ${y + h * 0.35})`} />
    {stage === 3 && <circle cx="60" cy={y - 3} r="6" fill={sun ? '#e0b43a' : '#e28fae'} />}
    {stage === 4 && <>{petals(sun ? 10 : 6, sun ? '#f0c43f' : '#f2a6c0')}<circle cx="60" cy={y - 6} r="7" fill={sun ? '#7a4b22' : '#f4d35e'} /></>}
  </>); }
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={`${STAGES[stage]} ${type}`}>
      <ellipse cx="60" cy="106" rx="36" ry="7" fill="#8a6a4f" opacity=".4" />{body}
    </svg>
  );
}
