import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { resend, EMAIL_FROM, APP_NAME, APP_URL } from '@/lib/email/resend-client'
import { getPasswordResetEmailHtml, getPasswordResetEmailText } from '@/lib/email/templates'
import crypto from 'crypto'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email tələb olunur' },
        { status: 400 }
      )
    }

    // Find user by email
    const { data: users } = await supabaseAdmin.auth.admin.listUsers()
    const user = users?.users?.find(u => u.email === email)

    if (!user) {
      // Return success even if user doesn't exist (security best practice)
      return NextResponse.json({
        success: true,
        message: 'Əgər bu email qeydiyyatdan keçibsə, şifrə yeniləmə linki göndəriləcək.'
      })
    }

    // Get user profile for full name
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('full_name')
      .eq('id', user.id)
      .single()

    // Generate reset token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 1) // Token valid for 1 hour

    // Delete any existing password reset tokens for this user
    await supabaseAdmin
      .from('verification_tokens')
      .delete()
      .eq('user_id', user.id)
      .eq('token_type', 'password_reset')

    const { error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .insert({
        user_id: user.id,
        token,
        token_type: 'password_reset',
        expires_at: expiresAt.toISOString()
      })

    if (tokenError) {
      console.error('Token creation error:', tokenError)
      return NextResponse.json(
        { error: 'Token yaradılarkən xəta baş verdi' },
        { status: 500 }
      )
    }

    // Send password reset email
    const resetUrl = `${APP_URL}/auth/reset-password?token=${token}`

    try {
      await resend.emails.send({
        from: EMAIL_FROM,
        to: email,
        subject: `Şifrə Yeniləmə - ${APP_NAME}`,
        html: getPasswordResetEmailHtml({
          userName: profile?.full_name || 'İstifadəçi',
          resetUrl
        }),
        text: getPasswordResetEmailText({
          userName: profile?.full_name || 'İstifadəçi',
          resetUrl
        }),
        headers: {
          'X-Entity-Ref-ID': `password-reset-${user.id}`,
          'Reply-To': EMAIL_FROM,
        },
        tags: [
          {
            name: 'category',
            value: 'password_reset'
          }
        ]
      })
    } catch (emailError) {
      console.error('Email send error:', emailError)
      return NextResponse.json(
        { error: 'Email göndərilmədi. Zəhmət olmasa daha sonra yenidən cəhd edin.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Şifrə yeniləmə linki email ünvanınıza göndərildi.'
    })

  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Daxili server xətası' },
      { status: 500 }
    )
  }
}
