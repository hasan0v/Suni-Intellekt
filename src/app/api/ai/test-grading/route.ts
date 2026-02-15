import { NextRequest, NextResponse } from 'next/server'
import { gradeSubmission, testOpenRouterConnection } from '@/lib/openrouter'

/**
 * Test endpoint to validate AI grading with 3 mock student submissions
 * GET: Run the full test suite
 */

// 3 test student submissions with varying quality
const TEST_SUBMISSIONS = [
  {
    studentName: 'Test Student A (Excellent)',
    taskTitle: 'Python List Operations',
    taskInstructions: 'Write a function to find the average of a list, handle empty lists, sort the list, and find max/min values.',
    maxScore: 100,
    content: JSON.stringify({
      cells: [
        {
          cell_type: 'markdown',
          source: ['# Tapşırıq 1: Python List Operations\n', '## Average, Sort, Max/Min'],
          metadata: {}
        },
        {
          cell_type: 'code',
          source: [
            'def calculate_average(numbers):\n',
            '    """Calculate average of a list of numbers."""\n',
            '    if not numbers:\n',
            '        return 0\n',
            '    return sum(numbers) / len(numbers)\n',
            '\n',
            'def sort_list(numbers):\n',
            '    """Sort a list in ascending order."""\n',
            '    return sorted(numbers)\n',
            '\n',
            'def find_min_max(numbers):\n',
            '    """Find min and max of a list."""\n',
            '    if not numbers:\n',
            '        return None, None\n',
            '    return min(numbers), max(numbers)\n',
            '\n',
            '# Test\n',
            'test_list = [45, 23, 67, 12, 89, 34]\n',
            'print(f"Average: {calculate_average(test_list)}")\n',
            'print(f"Sorted: {sort_list(test_list)}")\n',
            'print(f"Min/Max: {find_min_max(test_list)}")\n',
            'print(f"Empty list avg: {calculate_average([])}")\n'
          ],
          outputs: [
            {
              output_type: 'stream',
              text: ['Average: 45.0\n', 'Sorted: [12, 23, 34, 45, 67, 89]\n', 'Min/Max: (12, 89)\n', 'Empty list avg: 0\n']
            }
          ],
          execution_count: 1,
          metadata: {}
        }
      ],
      metadata: { kernelspec: { display_name: 'Python 3', language: 'python' } },
      nbformat: 4,
      nbformat_minor: 5
    })
  },
  {
    studentName: 'Test Student B (Average)',
    taskTitle: 'Python List Operations',
    taskInstructions: 'Write a function to find the average of a list, handle empty lists, sort the list, and find max/min values.',
    maxScore: 100,
    content: JSON.stringify({
      cells: [
        {
          cell_type: 'code',
          source: [
            '# average function\n',
            'def avg(lst):\n',
            '    total = 0\n',
            '    for i in lst:\n',
            '        total += i\n',
            '    return total / len(lst)\n',
            '\n',
            'nums = [45, 23, 67, 12, 89, 34]\n',
            'print(avg(nums))\n',
            'nums.sort()\n',
            'print(nums)\n'
          ],
          outputs: [
            {
              output_type: 'stream',
              text: ['45.0\n', '[12, 23, 34, 45, 67, 89]\n']
            }
          ],
          execution_count: 1,
          metadata: {}
        }
      ],
      metadata: { kernelspec: { display_name: 'Python 3', language: 'python' } },
      nbformat: 4,
      nbformat_minor: 5
    })
  },
  {
    studentName: 'Test Student C (Poor)',
    taskTitle: 'Python List Operations',
    taskInstructions: 'Write a function to find the average of a list, handle empty lists, sort the list, and find max/min values.',
    maxScore: 100,
    content: JSON.stringify({
      cells: [
        {
          cell_type: 'code',
          source: [
            'x = [45, 23, 67]\n',
            'print(sum(x)/3)\n'
          ],
          outputs: [
            {
              output_type: 'stream',
              text: ['45.0\n']
            }
          ],
          execution_count: 1,
          metadata: {}
        }
      ],
      metadata: { kernelspec: { display_name: 'Python 3', language: 'python' } },
      nbformat: 4,
      nbformat_minor: 5
    })
  }
]

export async function GET() {
  const results: Array<{
    student: string
    score: number | null
    feedback: string
    model: string
    tokensUsed?: number
    error?: string
    duration: number
  }> = []

  // First test connection
  const connectionTest = await testOpenRouterConnection()
  if (!connectionTest.success) {
    return NextResponse.json({
      success: false,
      error: `OpenRouter connection failed: ${connectionTest.error}`,
      model: connectionTest.model
    }, { status: 500 })
  }

  // Grade each test submission
  for (const submission of TEST_SUBMISSIONS) {
    const start = Date.now()
    try {
      const result = await gradeSubmission({
        content: submission.content,
        fileUrl: null,
        studentName: submission.studentName,
        taskTitle: submission.taskTitle,
        taskInstructions: submission.taskInstructions,
        maxScore: submission.maxScore
      })

      results.push({
        student: submission.studentName,
        score: result.suggestedScore,
        feedback: result.feedback,
        model: result.model,
        tokensUsed: result.tokensUsed,
        duration: Date.now() - start
      })
    } catch (error) {
      results.push({
        student: submission.studentName,
        score: null,
        feedback: '',
        model: connectionTest.model,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start
      })
    }
  }

  const allSuccess = results.every(r => r.score !== null && !r.error)
  const scores = results.filter(r => r.score !== null).map(r => r.score as number)
  
  // Validate score ordering (A should be highest, C should be lowest)
  const scoreOrderCorrect = scores.length === 3 && scores[0] >= scores[1] && scores[1] >= scores[2]

  return NextResponse.json({
    success: allSuccess,
    testPassed: allSuccess && scoreOrderCorrect,
    model: connectionTest.model,
    scoreOrderCorrect,
    summary: {
      totalTests: 3,
      passed: results.filter(r => r.score !== null).length,
      failed: results.filter(r => r.error).length,
      averageScore: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      totalTokens: results.reduce((sum, r) => sum + (r.tokensUsed || 0), 0),
      totalDuration: results.reduce((sum, r) => sum + r.duration, 0)
    },
    results
  })
}
