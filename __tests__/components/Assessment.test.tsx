import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Assessment } from '@/components/Assessment'
import type { Answers } from '@/lib/types'

const EMPTY_ANSWERS: Answers = { q1: null, q2: null, q3: null, q4: null, q5: null }
const mockOnAnswer = jest.fn()
const mockOnNext = jest.fn()
const mockOnBack = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
})

describe('Assessment', () => {
  it('shows the progress indicator as "Question 1 of 5" on first question', () => {
    render(
      <Assessment
        currentIndex={0}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    expect(screen.getByText('Question 1 of 5')).toBeInTheDocument()
  })

  it('disables the Next button when no answer is selected', () => {
    render(
      <Assessment
        currentIndex={0}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).toBeDisabled()
  })

  it('enables the Next button when an answer is selected', () => {
    const answers = { ...EMPTY_ANSWERS, q1: 2 }
    render(
      <Assessment
        currentIndex={0}
        answers={answers}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    const nextBtn = screen.getByRole('button', { name: /next/i })
    expect(nextBtn).not.toBeDisabled()
  })

  it('calls onAnswer with the correct key and value when a radio is selected', async () => {
    const user = userEvent.setup()
    render(
      <Assessment
        currentIndex={0}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    const radios = screen.getAllByRole('radio')
    await user.click(radios[0])
    expect(mockOnAnswer).toHaveBeenCalledWith('q1', 1)
  })

  it('calls onNext when Next button is clicked with an answer selected', async () => {
    const user = userEvent.setup()
    render(
      <Assessment
        currentIndex={0}
        answers={{ ...EMPTY_ANSWERS, q1: 1 }}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    await user.click(screen.getByRole('button', { name: /next/i }))
    expect(mockOnNext).toHaveBeenCalledTimes(1)
  })

  it('calls onBack when Back button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <Assessment
        currentIndex={1}
        answers={EMPTY_ANSWERS}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    await user.click(screen.getByRole('button', { name: /back/i }))
    expect(mockOnBack).toHaveBeenCalledTimes(1)
  })

  it('shows "See My Results →" on the last question', () => {
    render(
      <Assessment
        currentIndex={4}
        answers={{ ...EMPTY_ANSWERS, q5: 2 }}
        onAnswer={mockOnAnswer}
        onNext={mockOnNext}
        onBack={mockOnBack}
      />
    )
    expect(screen.getByRole('button', { name: /see my results/i })).toBeInTheDocument()
  })
})
