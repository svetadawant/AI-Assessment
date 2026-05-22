'use client'

import { useState } from 'react'
import type { LearnerFeedback } from '@/lib/types'

const Q10_OPTIONS = [
  'Additional tools',
  'Additional content to read on your own',
  'Hearing more from leaders and peers',
  'Practice in a small group',
]

interface LearnerFeedbackFormProps {
  onSubmit: (data: LearnerFeedback) => void
  onBack: () => void
}

export function LearnerFeedbackForm({ onSubmit, onBack }: LearnerFeedbackFormProps) {
  const [q10, setQ10] = useState<string | null>(null)
  const [q11, setQ11] = useState('')

  function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault()
    onSubmit({ q10, q11: q11.trim() })
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 w-full max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-8">

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#E7651C' }}>
              Support
            </p>
            <h2 className="text-lg font-semibold text-white mb-5">
              What would be MOST helpful to you to progress your own AI capabilities?
            </h2>
            <div className="space-y-3">
              {Q10_OPTIONS.map(option => (
                <label
                  key={option}
                  className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors border-gray-600"
                  style={q10 === option ? { borderColor: '#E7651C', backgroundColor: 'rgb(231 101 28 / 0.15)' } : undefined}
                >
                  <input
                    type="radio"
                    name="q10"
                    value={option}
                    checked={q10 === option}
                    onChange={() => setQ10(option)}
                    className="mt-0.5"
                    style={{ accentColor: '#E7651C' }}
                  />
                  <span className="text-sm text-gray-200">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-lg font-semibold text-white mb-3" htmlFor="q11">
              Anything else we should know on what would best support you on your AI adoption journey?
            </label>
            <textarea
              id="q11"
              rows={4}
              value={q11}
              onChange={e => setQ11(e.target.value)}
              placeholder="Optional — share anything that would help us support you better"
              className="w-full border border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 resize-none"
              style={{ '--tw-ring-color': '#E7651C' } as React.CSSProperties}
            />
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg transition-colors"
            >
              ← Back
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#E7651C' }}
            >
              See My Results →
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
