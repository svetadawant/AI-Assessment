import type { BenchmarkData, TierKey } from '@/lib/types'

const STAGES: TierKey[] = ['access', 'acceptance', 'adoption', 'action', 'autonomy']

const STAGE_LABELS: Record<TierKey, string> = {
  access:     'Stage 1\nAccess',
  acceptance: 'Stage 2\nAcceptance',
  adoption:   'Stage 3\nAdoption',
  action:     'Stage 4\nAction',
  autonomy:   'Stage 5\nAutonomy',
}

// SVG dimensions — 5 zones of 72px each
const W = 360
const H = 140
const BASELINE = 108
const MAX_H = 80
// X position is the center of each zone
const X: Record<TierKey, number> = {
  access:     36,
  acceptance: 108,
  adoption:   180,
  action:     252,
  autonomy:   324,
}
const ZONES: { key: TierKey; x: number; width: number }[] = [
  { key: 'access',     x: 0,   width: 72 },
  { key: 'acceptance', x: 72,  width: 72 },
  { key: 'adoption',   x: 144, width: 72 },
  { key: 'action',     x: 216, width: 72 },
  { key: 'autonomy',   x: 288, width: 72 },
]

function buildCurve(ys: Record<TierKey, number>, close: boolean): string {
  // Smooth bezier through 5 data points
  const pts: [number, number][] = STAGES.map(s => [X[s], ys[s]])
  // Control point offset (horizontal tension)
  const t = 36
  const segments = [
    `M 0,${BASELINE}`,
    `C ${pts[0][0] - t},${BASELINE} ${pts[0][0] - t},${pts[0][1]} ${pts[0][0]},${pts[0][1]}`,
    `C ${pts[0][0] + t},${pts[0][1]} ${pts[1][0] - t},${pts[1][1]} ${pts[1][0]},${pts[1][1]}`,
    `C ${pts[1][0] + t},${pts[1][1]} ${pts[2][0] - t},${pts[2][1]} ${pts[2][0]},${pts[2][1]}`,
    `C ${pts[2][0] + t},${pts[2][1]} ${pts[3][0] - t},${pts[3][1]} ${pts[3][0]},${pts[3][1]}`,
    `C ${pts[3][0] + t},${pts[3][1]} ${pts[4][0] - t},${pts[4][1]} ${pts[4][0]},${pts[4][1]}`,
    `C ${pts[4][0] + t},${pts[4][1]} ${W},${BASELINE} ${W},${BASELINE}`,
  ]
  if (close) segments.push('Z')
  return segments.join(' ')
}

interface BenchmarkChartProps {
  benchmark: BenchmarkData
  userTier: TierKey
}

export function BenchmarkChart({ benchmark, userTier }: BenchmarkChartProps) {
  const ys: Record<TierKey, number> = {
    access:     BASELINE - Math.max(4, (benchmark.access     / 100) * MAX_H),
    acceptance: BASELINE - Math.max(4, (benchmark.acceptance / 100) * MAX_H),
    adoption:   BASELINE - Math.max(4, (benchmark.adoption   / 100) * MAX_H),
    action:     BASELINE - Math.max(4, (benchmark.action     / 100) * MAX_H),
    autonomy:   BASELINE - Math.max(4, (benchmark.autonomy   / 100) * MAX_H),
  }

  const fillPath   = buildCurve(ys, true)
  const strokePath = buildCurve(ys, false)
  const userX = X[userTier]
  const userY = ys[userTier]

  return (
    <div aria-label="Distribution curve showing peer stage breakdown">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" overflow="visible">
        <defs>
          {ZONES.map(z => (
            <clipPath key={z.key} id={`dist-clip-${z.key}`}>
              <rect x={z.x} y={0} width={z.width} height={H} />
            </clipPath>
          ))}
        </defs>

        {/* Colored fill — user zone Guild orange, others muted */}
        {ZONES.map(z => (
          <path
            key={z.key}
            d={fillPath}
            fill={z.key === userTier ? '#E7651C' : '#4b5563'}
            clipPath={`url(#dist-clip-${z.key})`}
            opacity={z.key === userTier ? 0.25 : 0.18}
          />
        ))}

        {/* Curve outline */}
        <path d={strokePath} fill="none" stroke="#6b7280" strokeWidth={1.5} />

        {/* "You" marker — downward arrow above user's peak */}
        <polygon
          points={`${userX - 7},${userY - 22} ${userX + 7},${userY - 22} ${userX},${userY - 8}`}
          fill="#E7651C"
        />
        <text x={userX} y={userY - 26} textAnchor="middle" fontSize={10} fontWeight="700" fill="#E7651C">
          You
        </text>

        {/* Stage labels and percentages below baseline */}
        {STAGES.map(stage => {
          const isUser = stage === userTier
          const lines = STAGE_LABELS[stage].split('\n')
          return (
            <g key={stage}>
              <text x={X[stage]} y={BASELINE + 13} textAnchor="middle" fontSize={8}
                fontWeight={isUser ? '700' : '400'} fill={isUser ? '#E7651C' : '#6b7280'}>
                {lines[0]}
              </text>
              <text x={X[stage]} y={BASELINE + 23} textAnchor="middle" fontSize={8}
                fontWeight={isUser ? '700' : '400'} fill={isUser ? '#E7651C' : '#6b7280'}>
                {lines[1]}
              </text>
              <text x={X[stage]} y={BASELINE + 34} textAnchor="middle" fontSize={9}
                fontWeight={isUser ? '700' : '400'} fill={isUser ? '#E7651C' : '#9ca3af'}>
                {benchmark[stage].toFixed(0)}%
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
