import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, EMAIL_FROM, APP_NAME, APP_URL } from '@/lib/email/resend-client'
import { getVerificationEmailHtml, getVerificationEmailText } from '@/lib/email/templates'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email, password, fullName } = await request.json()

    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Email, şifrə və tam ad tələb olunur' },
        { status: 400 }
      )
    }

    // Check if user already exists in auth
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = existingUsers?.users?.find(u => u.email === email)
    
    if (existingAuthUser) {
      // Check if they have a profile
      const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('email_verified')
        .eq('id', existingAuthUser.id)
        .single()

      if (existingProfile) {
        if (existingProfile.email_verified) {
          return NextResponse.json(
            { error: 'Bu email artıq qeydiyyatdan keçib və təsdiqlənib' },
            { status: 400 }
          )
        } else {
          return NextResponse.json(
            { error: 'Bu email artıq qeydiyyatdan keçib. Zəhmət olmasa emailinizi yoxlayın və təsdiqləyin.' },
            { status: 400 }
          )
        }
      }
    }

    let userId: string

    // Create user with auto-confirm disabled or use existing
    if (existingAuthUser) {
      userId = existingAuthUser.id
    } else {
      const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: false, // User must verify email
        user_metadata: {
          full_name: fullName
        }
      })

      if (signUpError || !newUser.user) {
        console.error('Sign up error:', signUpError)
        return NextResponse.json(
          { error: signUpError?.message || 'Qeydiyyat zamanı xəta baş verdi' },
          { status: 400 }
        )
      }
      userId = newUser.user.id
    }

    // Create user profile (use upsert to handle existing profiles)
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: userId,
        full_name: fullName,
        role: 'student',
        email_verified: false
      }, {
        onConflict: 'id'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      // Only delete if we just created the user
      if (!existingAuthUser) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
      }
      return NextResponse.json(
        { error: 'Profil yaradılarkən xəta baş verdi' },
        { status: 500 }
      )
    }

    // Delete any existing verification tokens for this user
    await supabaseAdmin
      .from('verification_tokens')
      .delete()
      .eq('user_id', userId)
      .eq('token_type', 'email_verification')

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 24) // Token valid for 24 hours

    const { error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: userId,
        token,
        token_type: 'email_verification',
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json(
        { error: 'Təsdiq tokeni yaradılarkən xəta baş verdi' },
        { status: 500 }
      )
    }

    // Send verification email via Resend
    const verificationUrl = `${APP_URL}/auth/verify-email?token=${token}`

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Email Təsdiqi - ${APP_NAME}`,
        html: getVerificationEmailHtml({
          userName: fullName,
          verificationUrl
        }),
        text: getVerificationEmailText({
          userName: fullName,
          verificationUrl
        }),
        headers: {
          'X-Entity-Ref-ID': `verification-${userId}`,
          'Reply-To': EMAIL_FROM,
        },
        tags: [
          {
            name: 'category',
            value: 'email_verification'
          }
        ]
      })
    } catch (emailError) {
      console.error('Email send error:', emailError)
      // Don't fail the signup if email fails, user can resend
      return NextResponse.json({
        success: true,
        message: 'Qeydiyyat uğurlu oldu, lakin email göndərilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Qeydiyyat uğurlu oldu! Email ünvanınızı yoxlayın.'
    })

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Daxili server xətası' },
      { status: 500 }
    )
  }
}
