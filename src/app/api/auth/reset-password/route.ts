import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { token, newPassword } = await request.json()

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: 'Token və yeni şifrə tələb olunur' },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'Şifrə ən azı 8 simvoldan ibarət olmalıdır' },
        { status: 400 }
      )
    }

    // Find the token
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('verification_tokens')
      .select('*')
      .eq('token', token)
      .eq('token_type', 'password_reset')
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

    // Update user password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      tokenData.user_id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Şifrə yenilənərkən xəta baş verdi' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Şifrə uğurla yeniləndi! İndi daxil ola bilərsiniz.'
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Daxili server xətası' },
      { status: 500 }
    )
  }
}
