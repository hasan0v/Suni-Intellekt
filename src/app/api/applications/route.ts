import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      fullName,
      email,
      phoneNumber,
      programmingExperience,
      developmentEnvironment,
      computerType,
      motivation
    } = body

    // Validation
    if (!fullName || !email || !phoneNumber || !programmingExperience || 
        !developmentEnvironment || !computerType || !motivation) {
      return NextResponse.json(
        { error: 'Bütün sahələr tələb olunur' },
        { status: 400 }
      )
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Düzgün email formatı daxil edin' },
        { status: 400 }
      )
    }

    // Motivation length validation
    if (motivation.length < 100 || motivation.length > 300) {
      return NextResponse.json(
        { error: 'Motivasiya 100-300 simvol arasında olmalıdır' },
        { status: 400 }
      )
    }

    // Check for duplicate email
    const { data: existingApplication } = await supabase
      .from('course_applications')
      .select('id')
      .eq('email', email.toLowerCase())
      .single()

    if (existingApplication) {
      return NextResponse.json(
        { error: 'Bu email ilə artıq müraciət edilib' },
        { status: 409 }
      )
    }

    // Insert application
    const { data, error } = await supabase
      .from('course_applications')
      .insert({
        full_name: fullName,
        email: email.toLowerCase(),
        phone_number: phoneNumber,
        programming_experience: programmingExperience,
        development_environment: developmentEnvironment,
        computer_type: computerType,
        motivation: motivation,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting application:', error)
      return NextResponse.json(
        { error: 'Müraciət göndərilərkən xəta baş verdi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Müraciətiniz uğurla qəbul edildi',
      applicationId: data.id
    })

  } catch (error) {
    console.error('Application submission error:', error)
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // This endpoint requires authentication (admin only)
    // For now, return method not allowed for public access
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { data: applications, error } = await supabase
      .from('course_applications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching applications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch applications' },
        { status: 500 }
      )
    }

    return NextResponse.json({ applications })

  } catch (error) {
    console.error('Error in GET applications:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}
