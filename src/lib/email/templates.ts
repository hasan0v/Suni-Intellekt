import { APP_NAME } from './resend-client'

export interface EmailVerificationData {
  userName: string
  verificationUrl: string
}

export interface PasswordResetData {
  userName: string
  resetUrl: string
}

export const getVerificationEmailHtml = (data: EmailVerificationData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; background-color: #1428A0; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${APP_NAME}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px; color: #333333; font-size: 20px;">Salam ${data.userName}!</h2>
        <p style="margin: 0 0 20px; color: #666666; line-height: 1.5;">
          ${APP_NAME} platformasında qeydiyyatdan keçdiyiniz üçün təşəkkür edirik. Email ünvanınızı təsdiqləmək üçün aşağıdakı düyməyə klikləyin.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <a href="${data.verificationUrl}" style="display: inline-block; padding: 14px 30px; background-color: #1428A0; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Email Təsdiqi</a>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #999999; font-size: 13px; line-height: 1.5;">
          Link 24 saat ərzində etibarlıdır. Əgər bu sorğunu göndərməmisinizsə, emaili nəzərə almayın.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f5f5f5; text-align: center; color: #999999; font-size: 12px;">
        © ${new Date().getFullYear()} ${APP_NAME}
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export const getPasswordResetEmailHtml = (data: PasswordResetData): string => {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 20px; font-family: Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <tr>
      <td style="padding: 40px 30px; background-color: #1428A0; text-align: center;">
        <h1 style="margin: 0; color: #ffffff; font-size: 24px;">${APP_NAME}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="margin: 0 0 20px; color: #333333; font-size: 20px;">Salam ${data.userName}!</h2>
        <p style="margin: 0 0 20px; color: #666666; line-height: 1.5;">
          Hesabınız üçün şifrə yeniləmə sorğusu aldıq. Yeni şifrə təyin etmək üçün aşağıdakı düyməyə klikləyin.
        </p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td align="center" style="padding: 20px 0;">
              <a href="${data.resetUrl}" style="display: inline-block; padding: 14px 30px; background-color: #1428A0; color: #ffffff; text-decoration: none; border-radius: 5px; font-weight: bold;">Şifrəni Yenilə</a>
            </td>
          </tr>
        </table>
        <p style="margin: 20px 0 0; color: #999999; font-size: 13px; line-height: 1.5;">
          Link 1 saat ərzində etibarlıdır. Əgər bu sorğunu göndərməmisinizsə, emaili nəzərə almayın.
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 20px 30px; background-color: #f5f5f5; text-align: center; color: #999999; font-size: 12px;">
        © ${new Date().getFullYear()} ${APP_NAME}
      </td>
    </tr>
  </table>
</body>
</html>
  `
}

export const getVerificationEmailText = (data: EmailVerificationData): string => {
  return `
Salam ${data.userName}!

${APP_NAME} platformasında hesabınızı yaratdığınız üçün təşəkkür edirik!

Email ünvanınızı təsdiqləmək üçün aşağıdakı linkə daxil olun:
${data.verificationUrl}

Bu link 24 saat ərzində etibarlıdır.

Əgər siz bu hesabı yaratmamısınızsa, bu emaili nəzərə almayın.

Hörmətlə,
${APP_NAME} Komandası
  `.trim()
}

export const getPasswordResetEmailText = (data: PasswordResetData): string => {
  return `
Salam ${data.userName}!

Hesabınız üçün şifrə yeniləmə sorğusu aldıq.

Yeni şifrə təyin etmək üçün aşağıdakı linkə daxil olun:
${data.resetUrl}

Bu link 1 saat ərzində etibarlıdır.

Əgər siz bu sorğunu göndərməmisinizsə, bu emaili nəzərə almayın və hesabınız təhlükəsizdir.

Hörmətlə,
${APP_NAME} Komandası
  `.trim()
}
