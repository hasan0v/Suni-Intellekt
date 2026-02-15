/**
 * OpenRouter AI Service for LMS Auto-Grading
 * Uses z-ai/glm-5 model via OpenRouter API
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface OpenRouterResponse {
  id: string
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason: string
  }>
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface AIGradingResult {
  feedback: string
  suggestedScore: number | null
  model: string
  tokensUsed?: number
  rawResponse?: string
}

/**
 * Call OpenRouter API with the z-ai/glm-5 model
 */
export async function callOpenRouter(
  messages: OpenRouterMessage[],
  options?: {
    temperature?: number
    maxTokens?: number
    model?: string
  }
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY is not configured in environment variables')
  }

  const model = options?.model || process.env.OPENROUTER_MODEL || 'z-ai/glm-5'

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'X-Title': 'Suni Intellekt LMS - AI Grading'
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 4096,
      top_p: 0.9,
    })
  })

  if (!response.ok) {
    const errorBody = await response.text()
    console.error('OpenRouter API error:', response.status, errorBody)
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`)
  }

  return response.json()
}

/**
 * Grade a submission using OpenRouter AI
 */
export async function gradeSubmission(params: {
  content: string | null
  fileUrl: string | null
  studentName: string
  taskTitle: string
  taskInstructions: string
  maxScore: number
}): Promise<AIGradingResult> {
  const { content, fileUrl, studentName, taskTitle, taskInstructions, maxScore } = params

  // Get the actual content to grade
  let submissionContent = content
  if (fileUrl && !submissionContent) {
    try {
      const response = await fetch(fileUrl)
      if (response.ok) {
        submissionContent = await response.text()
      }
    } catch (e) {
      console.error('Failed to fetch file from URL:', e)
    }
  }

  if (!submissionContent) {
    throw new Error('No submission content available to grade')
  }

  // Try to parse as notebook
  let notebookText = submissionContent
  try {
    const parsed = typeof submissionContent === 'string' ? JSON.parse(submissionContent) : submissionContent
    if (parsed.cells && Array.isArray(parsed.cells)) {
      // Convert notebook cells to readable text
      notebookText = parsed.cells.map((cell: { cell_type: string; source: string[] | string; outputs?: Array<{ text?: string[]; data?: Record<string, string[]> }> }, i: number) => {
        const source = Array.isArray(cell.source) ? cell.source.join('') : cell.source
        const outputs = cell.outputs?.map((o: { text?: string[]; data?: Record<string, string[]> }) => {
          if (o.text) return Array.isArray(o.text) ? o.text.join('') : o.text
          if (o.data && o.data['text/plain']) return Array.isArray(o.data['text/plain']) ? o.data['text/plain'].join('') : o.data['text/plain']
          return ''
        }).filter(Boolean).join('\n') || ''

        return `[Cell ${i + 1} - ${cell.cell_type}]\n${source}${outputs ? `\n[Output]\n${outputs}` : ''}`
      }).join('\n\n---\n\n')
    }
  } catch {
    // Not JSON / not a notebook - use raw text
  }

  const systemPrompt = `You are an expert automated grading engine for an LMS (Learning Management System). 
You grade student submissions with precision, consistency, and objectivity.
All feedback MUST be in Azerbaijani (Azərbaycan dili).

GRADING RULES:
1. Evaluate based on: Correctness (max 85pts), Completeness (max 10pts), Clarity (max 5pts)
2. Total per-task score is capped at 100
3. Final score = rounded mean of all task scores, capped at max_score (${maxScore})
4. Be fair but strict — reward good work, penalize errors proportionally
5. Always provide specific, actionable feedback

FEEDBACK FORMAT (Markdown):
**Yekun bal: {score}/${maxScore}**

### Qiymətləndirmə

**Ümumi:**
{2-3 sentence summary in Azerbaijani}

**Güclü tərəflər:**
- {strength 1}
- {strength 2}

**Zəif tərəflər və tövsiyələr:**
- {issue 1 with specific recommendation}
- {issue 2 with specific recommendation}

### Tapşırıq analizi
{For each identified task/section, provide:}
- **Correctness**: X/85
- **Completeness**: Y/10
- **Clarity**: Z/5
- **Bal**: T/100
- {Brief specific feedback}

### Yekun tövsiyələr
1. {Most important improvement}
2. {Second improvement}
3. {Third improvement}

CRITICAL: The FIRST line of your response MUST be exactly: **Yekun bal: {number}/${maxScore}**
The score must be a realistic integer between 0 and ${maxScore}.`

  const userPrompt = `Grade this student submission:

**Student**: ${studentName}
**Task**: ${taskTitle}
**Instructions**: ${taskInstructions}
**Max Score**: ${maxScore}

**Submission Content**:
${notebookText.substring(0, 15000)}`

  const model = process.env.OPENROUTER_MODEL || 'z-ai/glm-5'

  const result = await callOpenRouter(
    [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    { temperature: 0.3, maxTokens: 4096, model }
  )

  const feedback = result.choices?.[0]?.message?.content || ''
  
  // Extract score from feedback
  const scoreMatch = feedback.match(/\*\*Yekun bal:\s*(\d+)/i)
  let suggestedScore = scoreMatch ? parseInt(scoreMatch[1]) : null
  
  // Fallback: try other patterns
  if (suggestedScore === null) {
    const altMatch = feedback.match(/(?:bal|score|qiymət)[\s:]*(\d+)/i)
    suggestedScore = altMatch ? parseInt(altMatch[1]) : null
  }

  // Ensure score is within bounds
  if (suggestedScore !== null) {
    suggestedScore = Math.max(0, Math.min(maxScore, suggestedScore))
  }

  return {
    feedback,
    suggestedScore,
    model,
    tokensUsed: result.usage?.total_tokens,
  }
}

/**
 * Test the OpenRouter connection
 */
export async function testOpenRouterConnection(): Promise<{ success: boolean; model: string; error?: string }> {
  try {
    const model = process.env.OPENROUTER_MODEL || 'z-ai/glm-5'
    const result = await callOpenRouter(
      [{ role: 'user', content: 'Say "OK" if you can read this.' }],
      { maxTokens: 10, model }
    )
    return {
      success: true,
      model,
    }
  } catch (error) {
    return {
      success: false,
      model: process.env.OPENROUTER_MODEL || 'z-ai/glm-5',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
