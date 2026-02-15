import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create admin Supabase client with service role key
const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// GET: Fetch submissions needing admin review
export async function GET() {
    try {
        const { data: submissions, error } = await supabaseAdmin
            .from('submissions')
            .select(`
        id,
        content,
        file_url,
        submitted_at,
        auto_graded_at,
        ai_score,
        points,
        feedback,
        status,
        needs_review,
        student_id,
        task_id
      `)
            .eq('needs_review', true)
            .order('auto_graded_at', { ascending: false })
            .limit(50)

        if (error) throw error

        // Fetch student and task info
        if (submissions && submissions.length > 0) {
            const studentIds = [...new Set(submissions.map(s => s.student_id))]
            const taskIds = [...new Set(submissions.map(s => s.task_id))]

            const { data: students } = await supabaseAdmin
                .from('user_profiles')
                .select('id, full_name')
                .in('id', studentIds)

            const { data: tasks } = await supabaseAdmin
                .from('tasks')
                .select('id, title, max_score')
                .in('id', taskIds)

            const studentMap = new Map(students?.map(s => [s.id, s]) || [])
            const taskMap = new Map(tasks?.map(t => [t.id, t]) || [])

            const enrichedSubmissions = submissions.map(sub => ({
                ...sub,
                student: studentMap.get(sub.student_id) || { full_name: 'Unknown Student' },
                task: taskMap.get(sub.task_id) || { title: 'Unknown Task', max_score: 100 }
            }))

            return NextResponse.json({
                success: true,
                count: enrichedSubmissions.length,
                submissions: enrichedSubmissions
            })
        }

        return NextResponse.json({
            success: true,
            count: 0,
            submissions: []
        })

    } catch (error) {
        console.error('Review queue fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch review queue' },
            { status: 500 }
        )
    }
}

// PATCH: Admin approves/adjusts grade and removes from review queue
export async function PATCH(request: NextRequest) {
    try {
        const { submissionId, finalPoints, feedback, approved } = await request.json()

        if (!submissionId) {
            return NextResponse.json(
                { error: 'Submission ID required' },
                { status: 400 }
            )
        }

        const updateData: Record<string, unknown> = {
            needs_review: false,
            graded_at: new Date().toISOString()
        }

        if (approved) {
            // Admin approved - use provided points or keep AI score
            updateData.status = 'graded'
            if (finalPoints !== undefined) {
                updateData.points = finalPoints
            }
            if (feedback !== undefined) {
                updateData.feedback = feedback
            }
        } else {
            // Admin rejected - requires resubmission
            updateData.status = 'rejected'
        }

        const { data, error } = await supabaseAdmin
            .from('submissions')
            .update(updateData)
            .eq('id', submissionId)
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({
            success: true,
            message: approved ? 'Submission approved and graded' : 'Submission rejected',
            submission: data
        })

    } catch (error) {
        console.error('Review queue update error:', error)
        return NextResponse.json(
            { error: 'Failed to update submission' },
            { status: 500 }
        )
    }
}
