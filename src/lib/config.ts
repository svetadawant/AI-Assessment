// src/lib/config.ts
import type { TierKey } from './types'

export interface QuestionOption {
  label: string
  value: 1 | 2 | 3 | 4
}

export interface Question {
  id: 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q8' | 'q9'
  category: string
  text: string
  options: [QuestionOption, QuestionOption, QuestionOption, QuestionOption]
}

export const QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'ACCESS',
    text: 'Today our teams use...',
    options: [
      { label: 'Free public versions of tools, at their discretion (ChatGPT free, Gemini free)', value: 1 },
      { label: 'Enterprise chat-based AI tools (MS Copilot, ChatGPT Enterprise, Gemini for Workspace)', value: 2 },
      { label: 'Enterprise co-work / co-pilot AI tools (GitHub Copilot, Salesforce Einstein, etc.)', value: 3 },
      { label: 'Enterprise tools with agentic capabilities (Copilot Studio, Agentforce, Claude, etc.)', value: 4 },
    ],
  },
  {
    id: 'q2',
    category: 'ACCESS',
    text: 'AI tools are primarily governed by...',
    options: [
      { label: 'No one / I don\'t know', value: 1 },
      { label: 'Managers or Business Units', value: 2 },
      { label: 'Leaders with supporting policy documents', value: 3 },
      { label: 'Dedicated governance teams and policies', value: 4 },
    ],
  },
  {
    id: 'q3',
    category: 'ACCEPTANCE',
    text: 'The average worker in my company believes AI is...',
    options: [
      { label: 'An unknown — not something they can safely use', value: 1 },
      { label: 'A useful tool for others, not that applicable to their own role', value: 2 },
      { label: 'An accelerant for their work, if used responsibly', value: 3 },
      { label: 'An opportunity to transform their role and skill set', value: 4 },
    ],
  },
  {
    id: 'q4',
    category: 'ADOPTION',
    text: 'AI is used daily for work by...',
    options: [
      { label: '< 25% of my peers', value: 1 },
      { label: '25–50% of my peers', value: 2 },
      { label: '50–80% of my peers', value: 3 },
      { label: '80%+ of my peers', value: 4 },
    ],
  },
  {
    id: 'q5',
    category: 'ADOPTION',
    text: 'AI "learning" is predominantly...',
    options: [
      { label: 'Self-determined by individuals or functional leaders', value: 1 },
      { label: 'General content library or LMS content', value: 2 },
      { label: 'Webinars and use case demos', value: 3 },
      { label: 'Company and tool-specific hands-on learning', value: 4 },
    ],
  },
  {
    id: 'q6',
    category: 'ACTION',
    text: 'Our Leaders are...',
    options: [
      { label: 'Quietly stalling on AI adoption or not taking a stance', value: 1 },
      { label: 'Advocating for AI adoption', value: 2 },
      { label: 'Actually personally modeling AI use', value: 3 },
      { label: 'Modeling AI Use and Strategy-Setting', value: 4 },
    ],
  },
  {
    id: 'q7',
    category: 'ACTION',
    text: 'Our workers are...',
    options: [
      { label: 'Using AI as "better Google" or not at all', value: 1 },
      { label: 'Using AI in isolated pilots or initiatives', value: 2 },
      { label: 'Habitually delegating to AI & accelerating work', value: 3 },
      { label: 'Building their own AI agents to evolve their job', value: 4 },
    ],
  },
  {
    id: 'q8',
    category: 'ACTION',
    text: 'Our teams are...',
    options: [
      { label: 'Independently experimenting', value: 1 },
      { label: 'Sharing use cases inconsistently', value: 2 },
      { label: 'Sharing what they are building effectively & systemically', value: 3 },
      { label: 'Using team-based AI strategies & governance', value: 4 },
    ],
  },
  {
    id: 'q9',
    category: 'AUTONOMY',
    text: 'Our AI Agents...',
    options: [
      { label: 'Do not exist / I don\'t know', value: 1 },
      { label: 'Do work when initiated by individual employees', value: 2 },
      { label: 'Are scheduled & governed at the team level', value: 3 },
      { label: 'Are systemic & collaborating cross-functionally', value: 4 },
    ],
  },
]

export interface TierConfig {
  displayName: string
  stage: number
  tagline: string
  outcomes: string
  need: string
  nextSteps: string
  description?: string
  tips?: string[]
}

export const TIER_CONFIG: Record<TierKey, TierConfig> = {
  access: {
    displayName: 'Access Focus',
    stage: 1,
    tagline: 'Establishing the foundation for your AI transformation',
    outcomes: 'Curiosity, hand-raisers for early adoption pilots',
    need: 'Enablement on clear company-specific policies',
    nextSteps: 'Focus on early learning around policies, expectations and the AI enablement journey',
    description: "You're in the first stage focused on ensuring your workforce has the tools and mindsets that will be the groundwork of your AI transformation. You're likely looking to engender a generally positive mindset around AI, establish basic norms and policies, and start identifying your early adopters who can serve as change champions.\n\nTo get there, you may want to scale \u201CAI 101\u201D learning focused on policies, expectations, and the AI enablement journey.\n\nHaving peers learn together at this stage helps to overcome psychological barriers and resistance.",
    tips: [
      'Measure your baseline \u2014 ensure you know how many of your employees are already using AI (personally and at work)',
      'Start with tool access and corresponding leadership guidance and usage policies \u2014 work with your IT and InfoSec teams on the basics of tools and policies that you will need to cover in your AI 101',
      'Think about starting with AI 101 learning \u2014 the basics of policies and expectations with an opportunity to overcome early resistance and learn from early adopters',
    ],
  },
  acceptance: {
    displayName: 'Acceptance Focus',
    stage: 2,
    tagline: 'Building AI literacy and confidence',
    outcomes: 'AI Literacy, Confidence',
    need: 'Supportive social environment, leader modeling',
    nextSteps: 'Introduce practical social learning opportunities',
    description: "You're in the second stage focused on ensuring your workforce has the mindset to accelerate the rest of your AI transformation. You're likely looking to engender a culture of AI usage, solidify norms and policies, and identify your early adopters to serve as change champions.\n\nTo get there, you may want to scale \u201CAI 101\u201D learning that galvanizes AI usage while clearly communicating policies and expectations.\n\nHaving peers learn together at this stage helps to overcome psychological barriers and resistance.",
    tips: [
      'Acceptance starts with leaders \u2014 catch your leaders in the act of leveraging AI themselves, and showcase their use cases and perspectives. Your workforce hears what you do even more loudly than what you say.',
      'Highlight your early adopters \u2014 there are likely individuals hidden (or not-so-hidden) within your organization who would make great change champions if showcased effectively',
      'Measure your baseline & progress \u2014 ensure you know how many of your employees are using AI, for which specific use cases, and with what outcomes',
    ],
  },
  adoption: {
    displayName: 'Adoption Focus',
    stage: 3,
    tagline: 'Forming new AI habits for your workforce',
    outcomes: 'AI Usage, Time Savings',
    need: 'Practice on company tools, contextualized group use cases',
    nextSteps: 'Learning in the flow of work to form new AI habits',
    description: "You\u2019re in the third stage \u2014 ready to accelerate the rest of your AI transformation through broader adoption within your organization. You\u2019re likely looking to ingrain AI in key workflows, projects, and individual habits.\n\nTo get there, you may want to scale \u201CAI 201\u201D learning that galvanizes AI usage and starts to move from experimentation to more systemic expectations.\n\nHaving peers learn together at this stage helps to catch up late adopters, establish common language and practices around AI, and lay the foundation for stronger AI governance.",
    tips: [
      'Take the workforce perspective \u2014 think about the parts of an individual\u2019s day they enjoy the least, and augment them with AI. Rather than just \u201Cteaching AI\u201D \u2014 teach them to perform their tasks more effectively using AI.',
      'Highlight your early adopters \u2014 leader and peer modeling can be more effective than general enablement at changing behavior. Allowing your change champions to engage in hands-on learning alongside later adopters will help to shift your adoption curve. (And introducing a little fun and friendly competition generally doesn\u2019t hurt either.)',
      'Measure your progress \u2014 ensure you know how many of your employees are using AI, for which specific use cases, and with what outcomes',
    ],
  },
  action: {
    displayName: 'Action Focus',
    stage: 4,
    tagline: 'Changing the way we work.',
    outcomes: 'AI business outcomes',
    need: 'Team alignment on goals and use cases, active collaboration',
    nextSteps: 'Cross-functional AND team-based AI project learning',
    description: "You\u2019re in the fourth stage \u2014 ready to move from just getting everyone using AI to leveraging it more systemically to unlock business outcomes. You\u2019re also hitting the stage where individuals need to shift from the mindset of \u201CI am using AI\u201D to \u201Cwe are using AI\u201D and how its use (and governance) in a team setting can unlock greater results.\n\nTo get there, you may want to scale \u201CAI 201\u201D learning that helps individuals work backward from the project-level outcome they want to achieve to the tools they need to use.\n\nHaving peers learn together at this stage helps to enable knowledge sharing, support AI governance, and avoid redundancies.",
    tips: [
      'Success is no longer just using AI \u2014 the goal has shifted to unlocking the business results you need, using AI. Your learning should reflect that.',
      'Practice on real work and tools \u2014 this stage requires practice in the flow of work. However and wherever work gets done is where you want to be teaching and \u201Cpracticing\u201D with AI.',
      'Measure your progress \u2014 ensure you know how many of your employees are using AI, for which specific use cases, and with what outcomes',
    ],
  },
  autonomy: {
    displayName: 'Autonomy Focus',
    stage: 5,
    tagline: 'Having AI work for you.',
    outcomes: 'Business agility & throughput',
    need: 'Strong but agile governance & cross-functional collaboration',
    nextSteps: 'Focus on continuous learning of AI advancements, evolving role definitions & business objectives',
    description: "You\u2019re in the fifth stage \u2014 ready to build systems that work for you.\n\nTo get there, you may want to scale \u201CAI 301\u201D learning that helps individuals build business outcome and systems thinking, and move from AI as a thought partner or assistant to AI for system delegation and autonomous work.\n\nHaving peers learn together at this stage helps to enable knowledge sharing, support AI governance, and avoid silos.\n\nAt this stage, you are likely not teaching AI \u2014 you are teaching systems thinking, business outcome-focus, and continuous learning with AI as technology evolves.",
  },
}
