import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Results } from '@/components/Results'
import type { ApiState } from '@/lib/types'

const mockOnRetry = jest.fn()
const mockOnStartOver = jest.fn()

beforeEach(() => jest.clearAllMocks())

const pendingState: ApiState = { status: 'pending', result: null, errorCode: null }
const successState: ApiState = {
  status: 'success',
  result: { score: 10, tier: 'developing', benchmark: { earlyStage: 25, developing: 50, advanced: 25 } },
  errorCode: null,
}
const benchmarkNullState: ApiState = {
  status: 'success',
  result: { score: 10, tier: 'developing', benchmark: null },
  errorCode: null,
}
const writeErrorState: ApiState = { status: 'error', result: null, errorCode: 'SHEET_WRITE_ERROR' }
const unknownErrorState: ApiState = { status: 'error', result: null, errorCode: 'UNKNOWN' }
const scoreOutOfRangeState: ApiState = { status: 'error', result: null, errorCode: 'SCORE_OUT_OF_RANGE' }

describe('Results — pending state', () => {
  it('shows loading indicator for benchmark', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={pendingState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('benchmark-loading')).toBeInTheDocument()
  })

  it('shows client-computed score and tier immediately', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={pendingState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-display')).toHaveTextContent('10 / 15')
    expect(screen.getByTestId('tier-display')).toHaveTextContent('Developing')
  })
})

describe('Results — success state', () => {
  it('renders the benchmark chart when benchmark data is present', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={successState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('list', { name: /benchmark distribution/i })).toBeInTheDocument()
  })

  it('uses server score/tier over client values', () => {
    const serverOverrideState: ApiState = {
      status: 'success',
      result: { score: 12, tier: 'advanced', benchmark: { earlyStage: 20, developing: 40, advanced: 40 } },
      errorCode: null,
    }
    render(
      <Results clientScore={10} clientTier="developing" apiState={serverOverrideState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-display')).toHaveTextContent('12 / 15')
    expect(screen.getByTestId('tier-display')).toHaveTextContent('Advanced')
  })
})

describe('Results — benchmark:null (partial success)', () => {
  it('shows "Benchmark data temporarily unavailable" instead of the chart', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={benchmarkNullState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('benchmark-unavailable')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: /benchmark distribution/i })).not.toBeInTheDocument()
  })
})

describe('Results — SHEET_WRITE_ERROR', () => {
  it('shows error message with retry button', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={writeErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong saving/i)
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })

  it('calls onRetry when the retry button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Results clientScore={10} clientTier="developing" apiState={writeErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    await user.click(screen.getByRole('button', { name: /retry/i }))
    expect(mockOnRetry).toHaveBeenCalledTimes(1)
  })

  it('keeps the client-computed score/tier visible on write error', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={writeErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-display')).toHaveTextContent('10 / 15')
  })
})

describe('Results — unknown 500 error treated as SHEET_WRITE_ERROR', () => {
  it('shows retry button for unknown error codes', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={unknownErrorState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

describe('Results — SCORE_OUT_OF_RANGE', () => {
  it('shows a dash instead of score/tier', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={scoreOutOfRangeState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByTestId('score-unavailable')).toBeInTheDocument()
    expect(screen.queryByTestId('score-display')).not.toBeInTheDocument()
  })

  it('hides the benchmark chart area entirely', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={scoreOutOfRangeState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.queryByRole('list', { name: /benchmark distribution/i })).not.toBeInTheDocument()
    expect(screen.queryByTestId('benchmark-loading')).not.toBeInTheDocument()
  })

  it('shows the specific score error message with no retry button', () => {
    render(
      <Results clientScore={10} clientTier="developing" apiState={scoreOutOfRangeState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/something went wrong calculating/i)
    expect(screen.queryByRole('button', { name: /retry/i })).not.toBeInTheDocument()
  })
})

describe('Results — Start Over button', () => {
  it('is always visible and calls onStartOver when clicked', async () => {
    const user = userEvent.setup()
    render(
      <Results clientScore={10} clientTier="developing" apiState={pendingState}
        onRetry={mockOnRetry} onStartOver={mockOnStartOver} />
    )
    const btn = screen.getByTestId('start-over')
    expect(btn).toBeInTheDocument()
    await user.click(btn)
    expect(mockOnStartOver).toHaveBeenCalledTimes(1)
  })
})
