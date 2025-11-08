import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY is not set')
}

export const resend = new Resend(process.env.RESEND_API_KEY)

export const EMAIL_FROM = process.env.EMAIL_FROM || 'onboarding@resend.dev'
export const APP_NAME = 'SÜNİ İNTELLEKT'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
