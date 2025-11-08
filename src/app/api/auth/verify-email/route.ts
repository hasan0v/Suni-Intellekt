import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token tələb olunur' },
        { status: 400 }
      )
    }

    // Find the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'email_verification')
      .is('used_at', null)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.json(
        { error: 'Etibarsız və ya vaxtı keçmiş token' },
        { status: 400 }
      )
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Tokenin vaxtı bitib' },
        { status: 400 }
      )
    }

    // Mark token as used
    await supabaseAdmin
      .from('verification_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', tokenData.id)

    // Update user email confirmation
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { email_confirm: true }
    )

    if (updateError) {
      console.error('User update error:', updateError)
      return NextResponse.json(
        { error: 'İstifadəçi yenilənərkən xəta baş verdi' },
        { status: 500 }
      )
    }

    // Update user profile
    await supabaseAdmin
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('id', tokenData.user_id)

    return NextResponse.json({
      success: true,
      message: 'Email uğurla təsdiqləndi! İndi daxil ola bilərsiniz.'
    })

  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Daxili server xətası' },
      { status: 500 }
    )
  }
}
