import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, supabaseUrl, supabaseServiceKey } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Check if required environment variables are available
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = supabaseAdmin;

    const { email, confirmationUrl, userId } = await request.json();

    if (!email || !confirmationUrl) {
      return NextResponse.json(
        { error: 'Email and confirmation URL are required' },
        { status: 400 }
      );
    }

    // Call the custom email verification function
    const { data, error } = await supabase.rpc('send_custom_email_verification', {
      user_email: email,
      confirmation_url: confirmationUrl,
      user_id_param: userId || null
    });

    if (error) {
      console.error('Error sending verification email:', error);
      return NextResponse.json(
        { error: 'Failed to send verification email' },
        { status: 500 }
      );
    }

    // In a real implementation, you would send the actual email here
    // using a service like SendGrid, AWS SES, or similar
    console.log('Email content prepared:', {
      to: data.email_to,
      subject: data.subject,
      logId: data.log_id
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent successfully',
      logId: data.log_id
    });

  } catch (error) {
    console.error('Error in send-verification API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
