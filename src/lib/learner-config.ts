import type { TierKey } from './types'
import type { Question, TierConfig } from './config'

export const LEARNER_QUESTIONS: Question[] = [
  {
    id: 'q1',
    category: 'ACCESS',
    text: 'For work, I personally use...',
    options: [
      { label: 'Free public AI tools on my own (ChatGPT free, Gemini free) — or nothing', value: 1 },
      { label: 'Enterprise AI chat tools my company provides (MS Copilot, ChatGPT Enterprise, Gemini for Workspace)', value: 2 },
      { label: 'AI tools built into my work software (GitHub Copilot, Salesforce Einstein, etc.)', value: 3 },
      { label: 'Advanced AI tools with agent capabilities that I actively configure', value: 4 },
    ],
  },
  {
    id: 'q2',
    category: 'ACCESS',
    text: "When it comes to AI policies at my company, I...",
    options: [
      { label: "Don't know what the policies are / there aren't any", value: 1 },
      { label: "Know policies exist but haven't read them closely", value: 2 },
      { label: 'Understand the guidelines and follow them', value: 3 },
      { label: 'Actively help shape AI usage norms on my team', value: 4 },
    ],
  },
  {
    id: 'q3',
    category: 'ACCEPTANCE',
    text: 'When it comes to AI in my role, I personally feel...',
    options: [
      { label: "Uncertain — I'm not sure it applies to my work or is safe to use", value: 1 },
      { label: "Curious but hesitant — I see how it helps others but haven't made it my own", value: 2 },
      { label: 'Confident — I see AI as a useful accelerant for my work', value: 3 },
      { label: 'Excited — I see AI as a way to transform what I do', value: 4 },
    ],
  },
  {
    id: 'q4',
    category: 'ADOPTION',
    text: 'On a typical workday, I use AI...',
    options: [
      { label: 'Rarely or never', value: 1 },
      { label: 'A few times a week', value: 2 },
      { label: 'Daily for specific tasks', value: 3 },
      { label: "Constantly — it's woven into most of my work", value: 4 },
    ],
  },
  {
    id: 'q5',
    category: 'ADOPTION',
    text: 'I primarily learn about AI by...',
    options: [
      { label: 'Figuring it out on my own when I need to', value: 1 },
      { label: 'Watching videos or reading articles in my own time', value: 2 },
      { label: 'Attending company webinars or demos', value: 3 },
      { label: 'Hands-on learning tied to my specific role and tools', value: 4 },
    ],
  },
  {
    id: 'q6',
    category: 'ACTION',
    text: 'My manager or leadership...',
    options: [
      { label: "Hasn't really addressed AI or seems to be avoiding it", value: 1 },
      { label: "Encourages AI use but I haven't seen them use it themselves", value: 2 },
      { label: 'Visibly uses AI and shares their own experience', value: 3 },
      { label: 'Actively models AI use and sets team-level AI goals', value: 4 },
    ],
  },
  {
    id: 'q7',
    category: 'ACTION',
    text: 'When I use AI at work, I mostly...',
    options: [
      { label: 'Use it like a search engine — quick answers or lookups', value: 1 },
      { label: 'Try it occasionally for one-off tasks', value: 2 },
      { label: 'Rely on it habitually to speed up my regular work', value: 3 },
      { label: 'Build prompts, workflows, or agents to handle recurring tasks', value: 4 },
    ],
  },
  {
    id: 'q8',
    category: 'ACTION',
    text: 'On my team, AI knowledge and use cases are...',
    options: [
      { label: 'Something people experiment with on their own', value: 1 },
      { label: 'Shared informally and inconsistently', value: 2 },
      { label: 'Shared regularly in a structured way', value: 3 },
      { label: 'Built into how our team operates and plans work', value: 4 },
    ],
  },
  {
    id: 'q9',
    category: 'AUTONOMY',
    text: 'My experience with AI agents (tools that act on your behalf) is...',
    options: [
      { label: "I haven't used them / I'm not sure what they are", value: 1 },
      { label: "I've used one that was set up for me", value: 2 },
      { label: "I've set up or customized an AI agent for my own work", value: 3 },
      { label: 'I use multiple agents and they work together across my workflow', value: 4 },
    ],
  },
]

export const LEARNER_TIER_CONFIG: Record<TierKey, TierConfig> = {
  access: {
    displayName: 'Access Focus',
    stage: 1,
    tagline: 'Getting familiar with the tools and expectations',
    outcomes: 'Awareness, first steps with AI tools',
    need: 'Tool access, clear policy guidance, low-stakes practice',
    nextSteps: 'Start with approved tools, read your AI policy, try one simple task',
    description: "You're just getting started with AI — and that's a completely normal place to be. The most important first step is getting familiar with the tools available to you and understanding what your company expects when it comes to AI use.\n\nTo get there, focus on learning what AI tools you have access to, reading your company's AI guidelines, and trying one or two simple tasks with AI to start building comfort.\n\nStarting with a peer or colleague at this stage can help break through uncertainty and make the first steps feel less overwhelming.",
    tips: [
      "Find out which AI tools your company has approved — knowing what's available (and allowed) is the starting point",
      "Read your company's AI usage policy — understanding the guardrails actually makes it easier to use AI with confidence",
      "Try one small thing with AI this week — summarizing a meeting, drafting a message, or answering a question you'd normally Google",
    ],
  },
  acceptance: {
    displayName: 'Acceptance Focus',
    stage: 2,
    tagline: "Building confidence that AI is for you, not just others",
    outcomes: 'Personal AI literacy, growing confidence',
    need: 'Relevant use cases, peer and leader modeling',
    nextSteps: 'Find use cases tied to your actual work and learn from colleagues who use AI regularly',
    description: "You're aware of AI and starting to explore it — but it may not feel fully relevant to your specific role yet. This stage is about building real confidence and shifting from 'AI is interesting' to 'AI is useful for me.'\n\nTo get there, you'll want to find use cases that match your actual day-to-day work and see peers and leaders using AI in practice — not just hearing about it.\n\nLearning alongside a peer at this stage helps normalize AI use and makes experimentation feel less risky.",
    tips: [
      "Ask a colleague who uses AI regularly to walk you through how they use it for their actual work — real examples are more motivating than generic tutorials",
      "Pick one task you do repeatedly and try doing it with AI assistance — even a small win builds momentum",
      "Notice how your manager or leaders talk about or use AI — their behavior is a signal of what's expected and valued",
    ],
  },
  adoption: {
    displayName: 'Adoption Focus',
    stage: 3,
    tagline: 'Forming real AI habits in the flow of your work',
    outcomes: 'Daily AI use, meaningful time savings',
    need: 'Role-specific practice, habit formation, peer knowledge sharing',
    nextSteps: 'Deepen usage in your specific workflows and share what\'s working with your team',
    description: "You're using AI regularly and it's genuinely speeding up your work. Now it's about going deeper — moving from occasional use to real habit, and from generic tasks to your specific workflows.\n\nTo get there, think about how AI fits into the flow of your actual job, not just one-off tasks. The goal is making AI a reliable part of how you work, every day.\n\nLearning with peers at this stage helps you catch new use cases, establish common language with your team, and push your usage further than you'd go alone.",
    tips: [
      "Think about the parts of your job you enjoy the least — those repetitive, draining tasks are your best AI opportunities",
      "Share what's working with your team; you may be further along than you think, and peer modeling accelerates everyone",
      "Try learning AI in the context of your actual tools and workflows, not just generic tutorials — context makes it stick",
    ],
  },
  action: {
    displayName: 'Action Focus',
    stage: 4,
    tagline: 'Shifting from personal productivity to team outcomes',
    outcomes: 'Team-level AI results, cross-functional impact',
    need: 'Shared goals, team-based AI practice, outcome-oriented thinking',
    nextSteps: 'Align with your team on AI goals and experiment with more advanced workflows',
    description: "You're a real AI practitioner — using it habitually, getting results, and starting to shape how your team works with it. The shift now is from personal productivity to team-level outcomes.\n\nTo get there, think about what your team is trying to accomplish, not just what you personally want to do faster. AI becomes even more powerful when your whole team is working with it toward a shared goal.\n\nLearning with your team at this stage builds shared language, surfaces what's working, and avoids duplication of effort.",
    tips: [
      "Start thinking in terms of outcomes, not just tasks — 'I want to improve this result' is a better starting point than 'help me write this thing'",
      "Experiment with more advanced prompting, custom instructions, or lightweight automation to go beyond the basics",
      "Your experience is genuinely valuable — sharing your use cases helps bring teammates forward and often teaches you something too",
    ],
  },
  autonomy: {
    displayName: 'Autonomy Focus',
    stage: 5,
    tagline: 'Having AI work for you — and helping others get there',
    outcomes: 'AI agents handling recurring work, role evolution, broader team impact',
    need: 'Systems thinking, cross-functional governance, continuous learning',
    nextSteps: 'Identify work to delegate to AI agents and help set team-level norms',
    description: "You're at the leading edge — using AI agents, building workflows, and thinking systemically about how AI can take work off your plate entirely. The focus now is continuous learning and helping those around you keep pace.\n\nTo get there, you may want to deepen your systems thinking — moving from 'I use AI' to 'AI does this work for me' — and start thinking about how agents can collaborate across your team and organization.\n\nAt this stage, it's less about learning AI basics and more about evolving your role, your team's workflows, and your organization's relationship with AI as it keeps advancing.",
    tips: [
      "Identify recurring work in your role that could be handed off to an AI agent — you should be spending time on things AI can't do yet",
      "Help establish team and cross-functional norms for how agents are governed and handed off — your experience makes you valuable here",
      "Stay curious and keep experimenting: the tools are evolving fast, and your edge is your willingness to keep learning ahead of the curve",
    ],
  },
}
