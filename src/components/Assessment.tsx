'use client'

import { QUESTIONS } from '@/lib/config'
import type { Question } from '@/lib/config'
import type { Answers } from '@/lib/types'

interface AssessmentProps {
  currentIndex: number
  answers: Answers
  onAnswer: (qKey: keyof Answers, value: number) => void
  onNext: () => void
  onBack: () => void
  questions?: Question[]
}

export function Assessment({ currentIndex, answers, onAnswer, onNext, onBack, questions = QUESTIONS }: AssessmentProps) {
  const question = questions[currentIndex]
  const qKey = question.id as keyof Answers
  const selected = answers[qKey]
  const isLast = currentIndex === questions.length - 1
  const questionNumber = currentIndex + 1

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 p-8 w-full max-w-lg">
        <div className="flex items-center gap-2 mb-6">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < questionNumber ? '' : 'bg-gray-600'
              }`}
            style={i < questionNumber ? { backgroundColor: '#E7651C' } : undefined}
            />
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-4">Question {questionNumber} of {QUESTIONS.length}</p>

        <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#E7651C' }}>{question.category}</p>
        <h2 className="text-lg font-semibold text-white mb-6">{question.text}</h2>

        <div className="space-y-3 mb-8">
          {question.options.map(option => (
            <label
              key={option.value}
              className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                selected === option.value
                  ? 'border-gray-600'
                  : 'border-gray-600 hover:border-gray-500'
              }`}
            style={selected === option.value ? { borderColor: '#E7651C', backgroundColor: 'rgb(231 101 28 / 0.15)' } : undefined}
            >
              <input
                type="radio"
                name={question.id}
                value={option.value}
                checked={selected === option.value}
                onChange={() => onAnswer(qKey, option.value)}
                className="mt-0.5"
                style={{ accentColor: '#E7651C' }}
              />
              <span className="text-sm text-gray-200">{option.label}</span>
            </label>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-sm text-gray-400 hover:text-gray-200 px-4 py-2 rounded-lg transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            disabled={selected === null}
            aria-disabled={selected === null}
            className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-opacity ${
              selected !== null
                ? 'text-white hover:opacity-90'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
            style={selected !== null ? { backgroundColor: '#E7651C' } : undefined}
          >
            {isLast ? 'See My Results →' : 'Next →'}
          </button>
        </div>
      </div>
    </div>
  )
}
