import { NextRequest, NextResponse } from 'next/server'
import { RepoAnalyzer, MarkdownGenerator } from '@smyt/core'
import type { AnalysisConfig } from '@smyt/core'

export async function POST(request: NextRequest) {
  try {
    const { repo, days = 30 } = await request.json()

    // Validate input
    if (!repo || typeof repo !== 'string') {
      return NextResponse.json(
        { error: 'Invalid repo format' },
        { status: 400 }
      )
    }

    const [owner, repoName] = repo.split('/')
    if (!owner || !repoName) {
      return NextResponse.json(
        { error: 'Repo format should be owner/repo' },
        { status: 400 }
      )
    }

    // Get GitHub token from Authorization header
    const authHeader = request.headers.get('Authorization')
    const githubToken = authHeader?.replace('Bearer ', '')

    // Fallback to environment variable if no auth header
    const token = githubToken || process.env.GITHUB_TOKEN

    // Get Anthropic credentials from environment
    const anthropicKey = process.env.ANTHROPIC_API_KEY
    const anthropicBaseUrl = process.env.ANTHROPIC_BASE_URL
    const model = process.env.MODEL || 'claude-opus-4.6'

    if (!token) {
      return NextResponse.json(
        { error: 'GitHub authentication required. Please login first.' },
        { status: 401 }
      )
    }

    if (!anthropicKey) {
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Configure analyzer
    const analysisConfig: AnalysisConfig = {
      githubToken: token,
      anthropicApiKey: anthropicKey,
      anthropicBaseUrl,
      model,
      activeDaysThreshold: parseInt(String(days)),
    }

    // Run analysis
    const analyzer = new RepoAnalyzer(analysisConfig)
    const analysis = await analyzer.analyze(owner, repoName)

    // Generate markdown
    const generator = new MarkdownGenerator()
    const markdown = generator.generate(analysis)

    return NextResponse.json({
      markdown,
      summary: analysis.summary,
      features: analysis.features,
    })
  } catch (error) {
    console.error('Analysis error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    )
  }
}
