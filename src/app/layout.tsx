import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI Maturity Self-Assessment',
  description: 'Assess your organization\'s AI enablement maturity and see how you compare to peers.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
