'use client'

import { useState } from 'react'

interface AnalysisFormProps {
  onAnalyze: (repo: string, days: number) => void
  loading: boolean
}

export function AnalysisForm({ onAnalyze, loading }: AnalysisFormProps) {
  const [repo, setRepo] = useState('')
  const [days, setDays] = useState(30)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (repo.trim()) {
      onAnalyze(repo.trim(), days)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="repo" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          GitHub Repository
        </label>
        <input
          type="text"
          id="repo"
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="owner/repo (例如: facebook/react)"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={loading}
          required
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          输入 GitHub 仓库地址，格式：owner/repo
        </p>
      </div>

      <div>
        <label htmlFor="days" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          活跃天数阈值
        </label>
        <input
          type="number"
          id="days"
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          min="1"
          max="365"
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
          disabled={loading}
        />
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          只分析最近 {days} 天内有更新的分支
        </p>
      </div>

      <button
        type="submit"
        disabled={loading || !repo.trim()}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            分析中...
          </>
        ) : (
          <>
            <span>🔍</span>
            开始分析
          </>
        )}
      </button>
    </form>
  )
}
