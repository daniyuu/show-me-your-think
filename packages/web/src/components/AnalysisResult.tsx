'use client';

import ReactMarkdown from 'react-markdown';

interface AnalysisResultProps {
  result: {
    markdown: string;
    summary: {
      totalActiveBranches: number;
      mainThemes: string[];
      potentialConflicts: number;
    };
  };
}

export function AnalysisResult({ result }: AnalysisResultProps) {
  return (
    <div className="p-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">活跃分支</div>
          <div className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
            {result.summary.totalActiveBranches}
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">主题数量</div>
          <div className="text-3xl font-bold text-purple-900 dark:text-purple-100 mt-1">
            {result.summary.mainThemes.length}
          </div>
        </div>

        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div className="text-sm text-orange-600 dark:text-orange-400 font-medium">潜在冲突</div>
          <div className="text-3xl font-bold text-orange-900 dark:text-orange-100 mt-1">
            {result.summary.potentialConflicts}
          </div>
        </div>
      </div>

      {/* Main Themes */}
      {result.summary.mainThemes.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">主要开发主题</h3>
          <div className="flex flex-wrap gap-2">
            {result.summary.mainThemes.map((theme, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm"
              >
                {theme}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Markdown Report */}
      <div className="prose dark:prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 pb-2 border-b border-gray-200 dark:border-gray-700">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-8 mb-4">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mt-6 mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 mb-4 space-y-1">
                {children}
              </ul>
            ),
            code: ({ children }) => (
              <code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm">
                {children}
              </code>
            ),
          }}
        >
          {result.markdown}
        </ReactMarkdown>
      </div>

      {/* Download Button */}
      <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => {
            const blob = new Blob([result.markdown], { type: 'text/markdown' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'think-report.md';
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-6 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
        >
          📥 下载 Markdown 报告
        </button>
      </div>
    </div>
  );
}
