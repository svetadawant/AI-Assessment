'use client'

import { useEffect, useRef, useState } from 'react'
import { IntakeForm } from '@/components/IntakeForm'
import { Assessment } from '@/components/Assessment'
import { Results } from '@/components/Results'
import { computeScore, assignTier } from '@/lib/scoring'
import { LEARNER_QUESTIONS, LEARNER_TIER_CONFIG } from '@/lib/learner-config'
import type { Answers, ApiState, IntakeData, Step, SubmitPayload, TierKey } from '@/lib/types'

const STORAGE_KEY = 'guild_learner_result'

const EMPTY_ANSWERS: Answers = {
  q1: null, q2: null, q3: null, q4: null, q5: null,
  q6: null, q7: null, q8: null, q9: null,
}
const EMPTY_INTAKE: IntakeData = { first_name: '', last_name: '', title: '', company_name: '' }
const INITIAL_API: ApiState = { status: 'idle', result: null, errorCode: null }

export default function LearnerPage() {
  const [step, setStep] = useState<Step>('intake')
  const [intake, setIntake] = useState<IntakeData>(EMPTY_INTAKE)
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [apiState, setApiState] = useState<ApiState>(INITIAL_API)
  const [clientScore, setClientScore] = useState(0)
  const [clientTier, setClientTier] = useState<ReturnType<typeof assignTier>>('access')

  const abortRef = useRef<{
    controller: AbortController
    timeoutId: ReturnType<typeof setTimeout>
  } | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return
    try {
      const { tier, score, rowNumber } = JSON.parse(saved) as { tier: TierKey; score: number; rowNumber: number | null }
      setClientTier(tier)
      setClientScore(score)
      setStep('results')
      fetchBenchmark(tier, score, rowNumber ?? null)
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchBenchmark(tier: TierKey, score: number, rowNumber: number | null = null) {
    setApiState({ status: 'pending', result: null, errorCode: null })
    try {
      const res = await fetch('/api/learner-benchmark')
      if (!res.ok) {
        setApiState({ status: 'error', result: null, errorCode: 'BENCHMARK_ERROR' })
        return
      }
      const benchmark = await res.json()
      setApiState({ status: 'success', result: { score, tier, benchmark, rowNumber }, errorCode: null })
    } catch {
      setApiState({ status: 'error', result: null, errorCode: 'BENCHMARK_ERROR' })
    }
  }

  function startOver() {
    if (abortRef.current) {
      clearTimeout(abortRef.current.timeoutId)
      abortRef.current.controller.abort()
      abortRef.current = null
    }
    localStorage.removeItem(STORAGE_KEY)
    setStep('intake')
    setIntake(EMPTY_INTAKE)
    setAnswers(EMPTY_ANSWERS)
    setQuestionIndex(0)
    setApiState(INITIAL_API)
    setClientScore(0)
    setClientTier('access')
  }

  function handleIntakeSubmit(data: IntakeData) {
    setIntake(data)
    setStep('assessment')
    setQuestionIndex(0)
  }

  function handleAnswer(qKey: keyof Answers, value: number) {
    setAnswers(prev => ({ ...prev, [qKey]: value }))
  }

  function handleNext() {
    if (questionIndex < 8) {
      setQuestionIndex(i => i + 1)
    } else {
      const fullAnswers = answers as {
        q1: number; q2: number; q3: number; q4: number; q5: number
        q6: number; q7: number; q8: number; q9: number
      }
      const score = computeScore(fullAnswers)
      const tier = assignTier(score)
      setClientScore(score)
      setClientTier(tier)
      setStep('results')
      setApiState({ status: 'pending', result: null, errorCode: null })
      submitToApi({ ...intake, ...fullAnswers })
    }
  }

  function handleBack() {
    if (questionIndex === 0) {
      setStep('intake')
    } else {
      setQuestionIndex(i => i - 1)
    }
  }

  async function submitToApi(payload: SubmitPayload) {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10_000)
    abortRef.current = { controller, timeoutId }

    try {
      const res = await fetch('/api/learner-submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      abortRef.current = null

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const code: string = body.code ?? 'UNKNOWN'
        setApiState({ status: 'error', result: null, errorCode: code })
        return
      }

      const data = await res.json()

      const localScore = computeScore(payload)
      if (data.score !== localScore || data.tier !== assignTier(localScore)) {
        console.warn('[learner] Server score/tier diverges from client computation', {
          server: { score: data.score, tier: data.tier },
          client: { score: localScore, tier: assignTier(localScore) },
        })
        setClientScore(data.score)
        setClientTier(data.tier)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify({ tier: data.tier, score: data.score, rowNumber: data.rowNumber ?? null }))

      setApiState({ status: 'success', result: data, errorCode: null })
    } catch (err: unknown) {
      clearTimeout(timeoutId)
      abortRef.current = null

      if (err instanceof Error && err.name === 'AbortError') {
        return
      }
      setApiState({ status: 'error', result: null, errorCode: 'SHEET_WRITE_ERROR' })
    }
  }

  function handleRetry() {
    const fullAnswers = answers as {
      q1: number; q2: number; q3: number; q4: number; q5: number
      q6: number; q7: number; q8: number; q9: number
    }
    setApiState({ status: 'pending', result: null, errorCode: null })
    submitToApi({ ...intake, ...fullAnswers })
  }

  if (step === 'intake') {
    return (
      <IntakeForm
        initial={intake}
        onSubmit={handleIntakeSubmit}
        title="Individual AI Readiness Assessment"
      />
    )
  }

  if (step === 'assessment') {
    return (
      <Assessment
        currentIndex={questionIndex}
        answers={answers}
        onAnswer={handleAnswer}
        onNext={handleNext}
        onBack={handleBack}
        questions={LEARNER_QUESTIONS}
      />
    )
  }

  return (
    <Results
      clientScore={clientScore}
      clientTier={clientTier}
      apiState={apiState}
      onRetry={handleRetry}
      onStartOver={startOver}
      tierConfig={LEARNER_TIER_CONFIG}
      emailApiPath="/api/learner-email"
    />
  )
}
