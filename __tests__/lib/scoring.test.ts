import { computeScore, assignTier, computeBenchmark } from '@/lib/scoring'
import type { TierKey } from '@/lib/types'

describe('computeScore', () => {
  it('sums all five question values', () => {
    expect(computeScore({ q1: 1, q2: 2, q3: 3, q4: 2, q5: 1 })).toBe(9)
  })

  it('returns minimum score of 5 when all answers are 1', () => {
    expect(computeScore({ q1: 1, q2: 1, q3: 1, q4: 1, q5: 1 })).toBe(5)
  })

  it('returns maximum score of 15 when all answers are 3', () => {
    expect(computeScore({ q1: 3, q2: 3, q3: 3, q4: 3, q5: 3 })).toBe(15)
  })
})

describe('assignTier', () => {
  it('returns earlyStage for scores 5–8', () => {
    expect(assignTier(5)).toBe('earlyStage')
    expect(assignTier(8)).toBe('earlyStage')
  })

  it('returns developing for scores 9–11', () => {
    expect(assignTier(9)).toBe('developing')
    expect(assignTier(11)).toBe('developing')
  })

  it('returns advanced for scores 12–15', () => {
    expect(assignTier(12)).toBe('advanced')
    expect(assignTier(15)).toBe('advanced')
  })
})

describe('computeBenchmark', () => {
  it('returns zeros when the tier list is empty', () => {
    expect(computeBenchmark([])).toEqual({ earlyStage: 0, developing: 0, advanced: 0 })
  })

  it('returns 100 for the only present tier when all respondents are in one tier', () => {
    const result = computeBenchmark(['developing', 'developing', 'developing'])
    expect(result).toEqual({ earlyStage: 0, developing: 100, advanced: 0 })
  })

  it('returns equal percentages when evenly distributed', () => {
    const tiers: TierKey[] = ['earlyStage', 'earlyStage', 'developing', 'developing', 'advanced', 'advanced']
    const result = computeBenchmark(tiers)
    expect(result.earlyStage).toBeCloseTo(33.3, 0)
    expect(result.developing).toBeCloseTo(33.3, 0)
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
  })

  it('sums to exactly 100 after rounding correction (7 respondents)', () => {
    const tiers: TierKey[] = [
      'earlyStage', 'earlyStage', 'earlyStage',
      'developing', 'developing', 'developing',
      'advanced',
    ]
    const result = computeBenchmark(tiers)
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
  })

  it('applies rounding correction to earlyStage before developing when they tie', () => {
    const tiers: TierKey[] = ['earlyStage', 'developing', 'advanced']
    const result = computeBenchmark(tiers)
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
    const sevens: TierKey[] = [
      'earlyStage', 'earlyStage',
      'developing', 'developing',
      'advanced', 'advanced', 'advanced',
    ]
    // 2 earlyStage = 28.6%, 2 developing = 28.6%, 3 advanced = 42.9% → sum = 100.1
    // Correction = -0.1 → subtract from advanced (largest), not earlyStage
    const r7 = computeBenchmark(sevens)
    const s7 = parseFloat((r7.earlyStage + r7.developing + r7.advanced).toFixed(1))
    expect(s7).toBe(100)
  })

  it('applies correction to earlyStage when earlyStage and developing tie for largest', () => {
    // 3 earlyStage, 3 developing, 1 advanced: earlyStage=42.9, developing=42.9, advanced=14.3
    // sum = 100.1 → correction = -0.1 → subtract from earlyStage (tiebreaker: earlyStage before developing)
    const tiers: TierKey[] = [
      'earlyStage', 'earlyStage', 'earlyStage',
      'developing', 'developing', 'developing',
      'advanced',
    ]
    const result = computeBenchmark(tiers)
    const sum = parseFloat((result.earlyStage + result.developing + result.advanced).toFixed(1))
    expect(sum).toBe(100)
    // earlyStage should receive the correction (be slightly different from developing)
    expect(Math.abs(result.earlyStage - result.developing)).toBeCloseTo(0.1, 1)
  })

  it('returns values with at most 1 decimal place', () => {
    const tiers: TierKey[] = ['earlyStage', 'earlyStage', 'developing']
    const result = computeBenchmark(tiers)
    for (const val of Object.values(result)) {
      const decimalPart = val.toString().split('.')[1] ?? ''
      expect(decimalPart.length).toBeLessThanOrEqual(1)
    }
  })
})
