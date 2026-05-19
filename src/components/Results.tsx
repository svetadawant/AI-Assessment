'use client'

import { useState } from 'react'
import { TIER_CONFIG } from '@/lib/config'
import { BenchmarkChart } from './BenchmarkChart'
import type { ApiState, TierKey } from '@/lib/types'

interface ResultsProps {
  clientScore: number
  clientTier: TierKey
  apiState: ApiState
  onRetry: () => void
  onStartOver: () => void
}

// All stages use Guild orange highlights for consistency
const STAGE_CARD_STYLE = {
  card:    'border-gray-600',
  badgeBg: 'rgba(231,101,28,0.15)',
  badgeText: '#E7651C',
  headingColor: '#E7651C',
}

export function Results({ clientScore, clientTier, apiState, onRetry, onStartOver }: ResultsProps) {
  const isScoreOutOfRange = apiState.errorCode === 'SCORE_OUT_OF_RANGE'
  const hasError = apiState.status === 'error'

  const displayTier = apiState.result?.tier ?? clientTier
  const config = TIER_CONFIG[displayTier]
  const styles = STAGE_CARD_STYLE

  const [emailValue, setEmailValue] = useState('')
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')

  async function handleEmailSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    setEmailStatus('sending')
    try {
      const res = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailValue.trim(),
          rowNumber: apiState.result?.rowNumber ?? null,
          tier: displayTier,
          score: apiState.result?.score ?? clientScore,
        }),
      })
      setEmailStatus(res.ok ? 'sent' : 'error')
    } catch {
      setEmailStatus('error')
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 w-full max-w-lg">

        {isScoreOutOfRange ? (
          <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 mb-6" role="alert">
            <p className="text-sm text-red-300">Something went wrong calculating your score.</p>
          </div>
        ) : (
          <>
            {/* Stage card */}
            {(() => {
              const peerPct = apiState.result?.benchmark?.[displayTier]
              return (
                <div className={`rounded-xl border p-5 mb-6 ${styles.card}`} style={{ backgroundColor: 'rgba(231,101,28,0.07)' }}>
                  <span
                    className="inline-block text-xs font-semibold uppercase tracking-widest px-2.5 py-1 rounded-full mb-3"
                    style={{ backgroundColor: styles.badgeBg, color: styles.badgeText, border: `1px solid rgba(231,101,28,0.3)` }}
                  >
                    Stage {config.stage}
                  </span>
                  <h2 className="text-2xl font-bold mb-1" style={{ color: styles.headingColor }}>{config.displayName}</h2>
                  <p className="text-sm text-gray-400 italic mb-4">{config.tagline}</p>
                  {config.description ? (
                    <div className="text-sm text-gray-300 leading-relaxed space-y-3">
                      {config.description.split('\n\n').map((para, i) => {
                        let content: React.ReactNode = para

                        const toGetIdx = para.indexOf('To get there')
                        if (toGetIdx !== -1) {
                          content = (
                            <>
                              {para.slice(0, toGetIdx)}
                              <span className="font-semibold text-white">To get there</span>
                              {para.slice(toGetIdx + 12)}
                            </>
                          )
                        }

                        const peersPhrase = 'Having peers learn together at this stage'
                        const peersIdx = para.indexOf(peersPhrase)
                        if (peersIdx !== -1) {
                          content = (
                            <>
                              <span className="font-semibold text-white">{peersPhrase}</span>
                              {para.slice(peersIdx + peersPhrase.length)}
                            </>
                          )
                        }

                        return <p key={i}>{content}</p>
                      })}
                      {config.tips && (
                        <div>
                          <p className="font-semibold text-sm uppercase tracking-widest mb-2" style={{ color: '#E7651C' }}>Specific tips</p>
                          <ol className="list-decimal list-inside space-y-1.5">
                            {config.tips.map((tip, i) => {
                              const dashIdx = tip.indexOf(' \u2014 ')
                              if (dashIdx === -1) return <li key={i}>{tip}</li>
                              return (
                                <li key={i}>
                                  <span className="font-semibold text-white">{tip.slice(0, dashIdx)}</span>
                                  {' \u2014 '}{tip.slice(dashIdx + 3)}
                                </li>
                              )
                            })}
                          </ol>
                        </div>
                      )}
                      {peerPct != null ? (
                        <p>
                          And you&apos;re not alone —{' '}
                          <span className="font-semibold" style={{ color: '#E7651C' }}>{peerPct}%</span>{' '}
                          of your peers are in the same stage.
                        </p>
                      ) : apiState.status === 'pending' ? (
                        <span className="text-gray-500 animate-pulse">Loading peer comparison…</span>
                      ) : null}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 leading-relaxed">
                      You&apos;re in the{' '}
                      <span className="font-semibold text-white">{config.displayName}</span>{' '}
                      stage, which means you&apos;re likely looking to drive{' '}
                      <span className="font-semibold text-white">{config.outcomes}</span>.{' '}
                      To get there, you may want to consider{' '}
                      <span className="font-semibold text-white">{config.nextSteps}</span>.{' '}
                      {peerPct != null ? (
                        <>
                          And you&apos;re not alone —{' '}
                          <span className="font-semibold" style={{ color: '#E7651C' }}>{peerPct}%</span>{' '}
                          of your peers are in the same stage.
                        </>
                      ) : apiState.status === 'pending' ? (
                        <span className="text-gray-500 animate-pulse">Loading peer comparison…</span>
                      ) : null}
                    </p>
                  )}
                </div>
              )
            })()}

            {/* Error saving results */}
            {hasError && (
              <div className="bg-red-900/40 border border-red-700 rounded-xl p-4 mb-6" role="alert">
                <p className="text-sm text-red-300 mb-2">
                  Something went wrong saving your results. Please try again.
                </p>
                <button
                  onClick={onRetry}
                  className="text-sm font-medium text-red-300 underline hover:no-underline"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Distribution curve */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wide">
                Where You Stand Among Peers
              </h3>
              {apiState.status === 'pending' && (
                <div className="text-sm text-gray-500 animate-pulse" data-testid="benchmark-loading">
                  Loading peer data…
                </div>
              )}
              {hasError && (
                <div className="text-sm text-gray-500" data-testid="benchmark-unavailable">
                  Peer data temporarily unavailable.
                </div>
              )}
              {apiState.status === 'success' && apiState.result?.benchmark === null && (
                <div className="text-sm text-gray-500" data-testid="benchmark-unavailable">
                  Peer data temporarily unavailable.
                </div>
              )}
              {apiState.status === 'success' && apiState.result?.benchmark != null && (
                <BenchmarkChart benchmark={apiState.result.benchmark} userTier={displayTier} />
              )}
            </div>
          </>
        )}

        {/* Email results */}
        {!isScoreOutOfRange && (
          <div className="mt-2">
            {!emailOpen && emailStatus !== 'sent' && (
              <div className="space-y-3">
                <button
                  onClick={() => setEmailOpen(true)}
                  className="w-full py-3 rounded-xl font-semibold text-sm transition-colors"
                  style={{ backgroundColor: 'rgba(231,101,28,0.15)', color: '#E7651C', border: '1px solid rgba(231,101,28,0.3)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(231,101,28,0.25)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(231,101,28,0.15)' }}
                >
                  Email me my results & more info
                </button>
                <button
                  onClick={onStartOver}
                  className="w-full py-3 rounded-xl font-semibold text-sm text-gray-400 hover:text-gray-200 border border-gray-600 transition-colors"
                >
                  Take assessment again
                </button>
              </div>
            )}
            {emailOpen && emailStatus !== 'sent' && (
              <form onSubmit={handleEmailSubmit} className="space-y-3">
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  value={emailValue}
                  onChange={e => setEmailValue(e.target.value)}
                  className="w-full border border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500"
                  disabled={emailStatus === 'sending'}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={emailStatus === 'sending'}
                    className="flex-1 py-2.5 rounded-lg font-semibold text-sm text-white transition-opacity disabled:opacity-60"
                    style={{ backgroundColor: '#E7651C' }}
                  >
                    {emailStatus === 'sending' ? 'Submitting…' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setEmailOpen(false); setEmailStatus('idle') }}
                    className="px-4 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-200 border border-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
                {emailStatus === 'error' && (
                  <p className="text-red-400 text-xs">Something went wrong. Please try again.</p>
                )}
              </form>
            )}
            {emailStatus === 'sent' && (
              <div className="text-center py-2 space-y-2">
                <p className="text-sm text-gray-400">Thank you — we will be in touch soon.</p>
                <p className="text-xs text-gray-500">
                  Reach out to{' '}
                  <a href="mailto:sveta.dawant@guild.com" className="underline hover:text-gray-300 transition-colors">
                    sveta.dawant@guild.com
                  </a>
                  {' '}with any questions.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
