import type { TierKey, BenchmarkData } from './types'

export function computeScore(answers: {
  q1: number; q2: number; q3: number; q4: number; q5: number
  q6: number; q7: number; q8: number; q9: number
}): number {
  return answers.q1 + answers.q2 + answers.q3 + answers.q4 + answers.q5
       + answers.q6 + answers.q7 + answers.q8 + answers.q9
}

// Score range: 9 (all 1s) – 36 (all 4s)
// Thresholds align "all Xs" answers with the expected stage:
//   all 1s =  9 → access
//   all 2s = 18 → acceptance
//   all 3s = 27 → adoption
//   all 4s = 36 → autonomy
export function assignTier(score: number): TierKey {
  if (score <= 13) return 'access'
  if (score <= 18) return 'acceptance'
  if (score <= 27) return 'adoption'
  if (score <= 32) return 'action'
  return 'autonomy'
}

export function computeBenchmark(tiers: TierKey[]): BenchmarkData {
  if (tiers.length === 0) {
    return { access: 0, acceptance: 0, adoption: 0, action: 0, autonomy: 0 }
  }

  const counts = { access: 0, acceptance: 0, adoption: 0, action: 0, autonomy: 0 }
  for (const tier of tiers) {
    counts[tier]++
  }

  const total = tiers.length
  const round1 = (n: number) => Math.round((n / total) * 1000) / 10

  const rounded: BenchmarkData = {
    access:     round1(counts.access),
    acceptance: round1(counts.acceptance),
    adoption:   round1(counts.adoption),
    action:     round1(counts.action),
    autonomy:   round1(counts.autonomy),
  }

  const sum = rounded.access + rounded.acceptance + rounded.adoption + rounded.action + rounded.autonomy
  const correction = Math.round((100 - sum) * 10) / 10

  if (correction !== 0) {
    const keys: TierKey[] = ['access', 'acceptance', 'adoption', 'action', 'autonomy']
    let maxKey = keys[0]
    for (const key of keys) {
      if (rounded[key] > rounded[maxKey]) maxKey = key
    }
    rounded[maxKey] = Math.round((rounded[maxKey] + correction) * 10) / 10
  }

  return rounded
}
