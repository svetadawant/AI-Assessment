'use client'

import { BenchmarkChart } from './BenchmarkChart'
import { LEARNER_TIER_CONFIG } from '@/lib/learner-config'
import type { ApiState, TierKey } from '@/lib/types'

interface LearnerResultsProps {
  clientTier: TierKey
  apiState: ApiState
}

export function LearnerResults({ clientTier, apiState }: LearnerResultsProps) {
  const displayTier = apiState.result?.tier ?? clientTier
  const config = LEARNER_TIER_CONFIG[displayTier]

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 w-full max-w-lg">

        {/* Stage badge */}
        <div className="mb-6">
          <span
            className="inline-block text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
            style={{ backgroundColor: 'rgba(231,101,28,0.15)', color: '#E7651C', border: '1px solid rgba(231,101,28,0.3)' }}
          >
            Stage {config.stage}
          </span>
          <h2 className="text-2xl font-bold mb-1" style={{ color: '#E7651C' }}>{config.displayName}</h2>
          <p className="text-sm text-gray-400 italic">{config.tagline}</p>
        </div>

        {/* Peer comparison */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
            Where You Stand Among Peers
          </h3>
          {apiState.status === 'pending' && (
            <div className="text-sm text-gray-500 animate-pulse">Loading peer data…</div>
          )}
          {apiState.status === 'error' && (
            <div className="text-sm text-gray-500">Peer data temporarily unavailable.</div>
          )}
          {apiState.status === 'success' && apiState.result?.benchmark == null && (
            <div className="text-sm text-gray-500">Peer data temporarily unavailable.</div>
          )}
          {apiState.status === 'success' && apiState.result?.benchmark != null && (
            <BenchmarkChart benchmark={apiState.result.benchmark} userTier={displayTier} />
          )}
        </div>

        {/* Tips */}
        {config.tips && config.tips.length > 0 && (
          <div className="mb-6">
            <p className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: '#E7651C' }}>
              Tips for your next steps
            </p>
            <ol className="list-decimal list-inside space-y-2">
              {config.tips.map((tip, i) => {
                const dashIdx = tip.indexOf(' — ')
                if (dashIdx === -1) return <li key={i} className="text-sm text-gray-300">{tip}</li>
                return (
                  <li key={i} className="text-sm text-gray-300">
                    <span className="font-semibold text-white">{tip.slice(0, dashIdx)}</span>
                    {' — '}{tip.slice(dashIdx + 3)}
                  </li>
                )
              })}
            </ol>
          </div>
        )}

        {/* Thank you */}
        <div
          className="rounded-xl p-4 text-sm text-gray-300 leading-relaxed"
          style={{ backgroundColor: 'rgba(231,101,28,0.07)', border: '1px solid rgba(231,101,28,0.2)' }}
        >
          Thank you for your input — we'll be reviewing results and using them to inform additional learning opportunities.
        </div>

      </div>
    </div>
  )
}
