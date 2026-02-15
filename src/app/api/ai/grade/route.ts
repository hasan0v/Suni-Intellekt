import { NextRequest, NextResponse } from 'next/server'
import { gradeSubmission, testOpenRouterConnection } from '@/lib/openrouter'

export async function POST(request: NextRequest) {
  try {
    const { notebookContent, studentName, fileUrl, taskTitle, taskInstructions, maxScore } = await request.json()

    if (!notebookContent && !fileUrl) {
      return NextResponse.json(
        { error: 'Notebook content or file URL required' },
        { status: 400 }
      )
    }

    const result = await gradeSubmission({
      content: notebookContent,
      fileUrl: fileUrl,
      studentName: studentName || 'Unknown Student',
      taskTitle: taskTitle || 'Task',
      taskInstructions: taskInstructions || 'No instructions provided',
      maxScore: maxScore || 100
    })

    return NextResponse.json({
      success: true,
      feedback: result.feedback,
      suggestedScore: result.suggestedScore,
      model: result.model,
      tokensUsed: result.tokensUsed
    })

  } catch (error: unknown) {
    console.error('AI Grading Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to grade submission' },
      { status: 500 }
    )
  }
}

// GET endpoint to test the OpenRouter connection
export async function GET() {
  try {
    const result = await testOpenRouterConnection()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Connection test failed' },
      { status: 500 }
    )
  }
}
