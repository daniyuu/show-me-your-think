'use client';

export function LandingPage() {
  return (
    <div className="max-w-3xl mx-auto text-center space-y-12 py-12">
      {/* Hero */}
      <div className="space-y-4">
        <div className="text-6xl">🧠</div>
        <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
          Understand the <span className="text-blue-600 dark:text-blue-400">&quot;Why&quot;</span>{' '}
          Behind the Code
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Show Me Your Think analyzes GitHub repositories to surface the reasoning behind code
          changes — not just what changed, but why it changed.
        </p>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-2xl mb-3">🔍</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Branch Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Scan active branches to understand what each contributor is working on and why.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-2xl mb-3">💡</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Commit Insights</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Go beyond commit messages to uncover the intent and context behind each change.
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="text-2xl mb-3">📊</div>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">PR Summaries</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Get concise summaries of pull requests, their goals, and their impact on the project.
          </p>
        </div>
      </div>

      {/* Login CTA */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-700 space-y-4">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Get Started</h3>
        <p className="text-gray-600 dark:text-gray-400">
          Sign in with GitHub to start analyzing repositories. GitHub authentication is required to
          access branch data, commits, and pull requests via the GitHub API.
        </p>
        <a
          href="/api/auth/github"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-gray-700 hover:bg-gray-800 dark:hover:bg-gray-600 text-white rounded-lg transition-colors text-lg font-medium"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
              clipRule="evenodd"
            />
          </svg>
          Login with GitHub
        </a>
      </div>
    </div>
  );
}
