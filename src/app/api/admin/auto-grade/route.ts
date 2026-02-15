import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { gradeSubmission } from '@/lib/openrouter'

// Create admin Supabase client with service role key for background processing
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Configuration
const BONUS_THRESHOLD = 70  // Score threshold for bonus points
const BONUS_POINTS = 5      // Bonus points to add
const MAX_SCORE = 100       // Maximum allowed score
const BATCH_SIZE = 3        // Process this many submissions per run (keep small to avoid timeouts)

interface AutoGradeResult {
    submissionId: string
    studentName: string
    aiScore: number | null
    finalScore: number | null
    status: 'graded' | 'pending_review' | 'error'
    bonusApplied: boolean
    error?: string
}

// GET: Get auto-grading status and pending count
export async function GET() {
    try {
        // Count pending submissions
        const { count: pendingCount, error: pendingError } = await supabaseAdmin
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'submitted')

        if (pendingError) throw pendingError

        // Count review queue
        const { count: reviewCount, error: reviewError } = await supabaseAdmin
            .from('submissions')
            .select('*', { count: 'exact', head: true })
            .eq('needs_review', true)

        if (reviewError) throw reviewError

        // Get last auto-graded submission time
        const { data: lastGraded, error: lastError } = await supabaseAdmin
            .from('submissions')
            .select('auto_graded_at')
            .not('auto_graded_at', 'is', null)
            .order('auto_graded_at', { ascending: false })
            .limit(1)
            .single()

        return NextResponse.json({
            pendingSubmissions: pendingCount || 0,
            reviewQueueCount: reviewCount || 0,
            lastAutoGradedAt: lastGraded?.auto_graded_at || null,
            config: {
                bonusThreshold: BONUS_THRESHOLD,
                bonusPoints: BONUS_POINTS,
                maxScore: MAX_SCORE,
                batchSize: BATCH_SIZE
            }
        })

    } catch (error) {
        console.error('Auto-grade status error:', error)
        return NextResponse.json(
            { error: 'Failed to get auto-grading status' },
            { status: 500 }
        )
    }
}

// POST: Trigger auto-grading run
export async function POST(request: NextRequest) {
    const results: AutoGradeResult[] = []

    try {
        // Parse optional parameters
        const body = await request.json().catch(() => ({}))
        const batchSize = body.batchSize || BATCH_SIZE

        // Fetch pending submissions with their task and student info
        const { data: submissions, error: fetchError } = await supabaseAdmin
            .from('submissions')
            .select(`
        id,
        content,
        file_url,
        student_id,
        task_id,
        tasks!inner(title, instructions, max_score)
      `)
            .eq('status', 'submitted')
            .order('submitted_at', { ascending: true })
            .limit(batchSize)

        if (fetchError) throw fetchError

        if (!submissions || submissions.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No pending submissions to process',
                processed: 0,
                results: []
            })
        }

        // Fetch student names
        const studentIds = [...new Set(submissions.map(s => s.student_id))]
        const { data: students } = await supabaseAdmin
            .from('user_profiles')
            .select('id, full_name')
            .in('id', studentIds)

        const studentMap = new Map(students?.map(s => [s.id, s.full_name]) || [])

        // Process each submission
        for (const submission of submissions) {
            const studentName = studentMap.get(submission.student_id) || 'Unknown Student'
            const taskData = (submission.tasks as unknown) as { title: string; instructions: string; max_score: number }
            const maxScore = taskData?.max_score || 100
            const taskTitle = taskData?.title || 'Task'
            const taskInstructions = taskData?.instructions || 'No instructions'

            // Skip submissions without content or file_url - flag for manual review
            if (!submission.content && !submission.file_url) {
                // Mark as pending_review so admin can handle manually
                await supabaseAdmin
                    .from('submissions')
                    .update({
                        status: 'pending_review',
                        needs_review: true,
                        feedback: 'Təqdimat boşdur - məzmun və ya fayl tapılmadı. Admin tərəfindən yoxlanılmalıdır.',
                        ai_score: 0,
                        points: 0,
                        auto_graded_at: new Date().toISOString()
                    })
                    .eq('id', submission.id)

                results.push({
                    submissionId: submission.id,
                    studentName,
                    aiScore: 0,
                    finalScore: 0,
                    status: 'pending_review',
                    bonusApplied: false,
                    error: 'Empty submission - flagged for admin review'
                })
                continue
            }

            try {
                // Call AI grading directly (no HTTP - avoids timeout issues)
                const aiResult = await gradeSubmission({
                    content: submission.content,
                    fileUrl: submission.file_url,
                    studentName: studentName,
                    taskTitle: taskTitle,
                    taskInstructions: taskInstructions,
                    maxScore: maxScore
                })

                const aiScore = aiResult.suggestedScore

                if (aiScore === null || aiScore === undefined) {
                    throw new Error('AI did not return a suggested score')
                }

                // Calculate final score based on threshold
                let finalScore: number
                let status: 'graded' | 'pending_review'
                let bonusApplied = false
                let needsReview = false

                if (aiScore >= BONUS_THRESHOLD) {
                    // Apply bonus points (capped at max)
                    finalScore = Math.min(maxScore, Math.min(MAX_SCORE, aiScore + BONUS_POINTS))
                    bonusApplied = aiScore + BONUS_POINTS !== finalScore ? false : true
                    status = 'graded'
                } else {
                    // Flag for admin review
                    finalScore = aiScore
                    status = 'pending_review'
                    needsReview = true
                }

                // Update submission in database
                const { error: updateError } = await supabaseAdmin
                    .from('submissions')
                    .update({
                        points: finalScore,
                        feedback: aiResult.feedback,
                        status: status,
                        ai_score: aiScore,
                        needs_review: needsReview,
                        auto_graded_at: new Date().toISOString(),
                        graded_at: status === 'graded' ? new Date().toISOString() : null
                    })
                    .eq('id', submission.id)

                console.log(`[Auto-Grade] ${studentName}: AI=${aiScore}, Final=${finalScore}, Status=${status}`)

                if (updateError) throw updateError

                results.push({
                    submissionId: submission.id,
                    studentName,
                    aiScore,
                    finalScore,
                    status,
                    bonusApplied
                })

            } catch (submissionError) {
                console.error(`Error processing submission ${submission.id}:`, submissionError)
                results.push({
                    submissionId: submission.id,
                    studentName,
                    aiScore: null,
                    finalScore: null,
                    status: 'error',
                    bonusApplied: false,
                    error: submissionError instanceof Error ? submissionError.message : 'Unknown error'
                })
            }
        }

        const successCount = results.filter(r => r.status !== 'error').length
        const reviewCount = results.filter(r => r.status === 'pending_review').length
        const gradedCount = results.filter(r => r.status === 'graded').length

        return NextResponse.json({
            success: true,
            message: `Processed ${successCount} of ${submissions.length} submissions`,
            processed: successCount,
            graded: gradedCount,
            flaggedForReview: reviewCount,
            errors: results.filter(r => r.status === 'error').length,
            results
        })

    } catch (error) {
        console.error('Auto-grade error:', error)
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Failed to run auto-grading',
                results
            },
            { status: 500 }
        )
    }
}
