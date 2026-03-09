import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Show Me Your Think',
  description: 'Analyze GitHub repositories to understand what and why',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
