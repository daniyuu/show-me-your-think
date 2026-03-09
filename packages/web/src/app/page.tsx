'use client'

import { useState } from 'react'
import { AnalysisForm } from '@/components/AnalysisForm'
import { AnalysisResult } from '@/components/AnalysisResult'

export default function Home() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async (repo: string, days: number) => {
    setLoading(true)
    setResult(null)

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repo, days }),
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('分析失败，请检查仓库名称或稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="text-4xl">🧠</div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Show Me Your Think
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Analyze GitHub repositories to understand what and why
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Analysis Form */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700">
            <AnalysisForm onAnalyze={handleAnalyze} loading={loading} />
          </div>

          {/* Loading State */}
          {loading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-12 border border-gray-100 dark:border-gray-700">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  正在分析中，请稍候...
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  这可能需要几分钟时间
                </p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !loading && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <AnalysisResult result={result} />
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-20 py-8 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>Built by <a href="https://github.com/daniyuu" className="text-blue-600 dark:text-blue-400 hover:underline">@daniyuu</a></p>
          <p className="mt-1">Because understanding the "why" matters more than the "what"</p>
        </div>
      </footer>
    </div>
  )
}
