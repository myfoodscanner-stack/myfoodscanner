import React from 'react';

interface ScoreGaugeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, size = 'md', showLabel = true }) => {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));

  let color = '#10b981'; // Green
  let label = 'Good Choice';
  let badgeBg = 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';

  if (safeScore <= 30) {
    color = '#e53935'; // Red
    label = 'Avoid';
    badgeBg = 'bg-red-950/80 text-red-300 border-red-500/40';
  } else if (safeScore <= 60) {
    color = '#ff9800'; // Orange
    label = 'Moderate';
    badgeBg = 'bg-amber-950/80 text-amber-300 border-amber-500/40';
  } else if (safeScore <= 80) {
    color = '#eab308'; // Yellow
    label = 'Acceptable';
    badgeBg = 'bg-yellow-950/80 text-yellow-300 border-yellow-500/40';
  }

  const dimensions = {
    sm: { diameter: 70, stroke: 6, fontSize: 'text-lg', labelSize: 'text-xs' },
    md: { diameter: 120, stroke: 10, fontSize: 'text-3xl', labelSize: 'text-xs' },
    lg: { diameter: 160, stroke: 14, fontSize: 'text-5xl', labelSize: 'text-sm' },
  }[size];

  const radius = (dimensions.diameter - dimensions.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (safeScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative flex items-center justify-center" style={{ width: dimensions.diameter, height: dimensions.diameter }}>
        <svg
          className="transform -rotate-90"
          width={dimensions.diameter}
          height={dimensions.diameter}
        >
          {/* Background circle */}
          <circle
            cx={dimensions.diameter / 2}
            cy={dimensions.diameter / 2}
            r={radius}
            stroke="#1c2f1c"
            strokeWidth={dimensions.stroke}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={dimensions.diameter / 2}
            cy={dimensions.diameter / 2}
            r={radius}
            stroke={color}
            strokeWidth={dimensions.stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Score in center */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`font-bold font-display tracking-tight text-white ${dimensions.fontSize}`}>
            {safeScore}
          </span>
          <span className="text-[10px] uppercase font-semibold text-emerald-400/70">/ 100</span>
        </div>
      </div>

      {showLabel && (
        <span
          className={`mt-2 px-3 py-0.5 rounded-full border font-semibold tracking-wide uppercase ${dimensions.labelSize} ${badgeBg}`}
        >
          {label}
        </span>
      )}
    </div>
  );
};
