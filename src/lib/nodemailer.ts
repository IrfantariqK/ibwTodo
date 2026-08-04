import nodemailer from "nodemailer";

export function generateAutoPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  let randomStr = "";
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `Tc-${randomStr}!`;
}

interface SendInviteOptions {
  email: string;
  name: string;
  role: string;
  type: "client" | "team";
  projectName: string;
  autoPassword: string;
  token: string;
  baseUrl?: string;
}

export async function sendInvitationEmail(options: SendInviteOptions): Promise<boolean> {
  const { email, name, role, type, projectName, autoPassword, token, baseUrl } = options;

  const appUrl = baseUrl || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const acceptLink = `${appUrl}/accept-invite?token=${token}`;

  const isClient = type === "client";
  const recipientLabel = isClient ? "Client Partner" : "Team Member";

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"TaskConnect Workspace" <noreply@taskconnect.io>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 580px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #004d40 0%, #00897b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; }
          .body-content { padding: 32px 28px; }
          .badge { display: inline-block; background-color: #e6f4f1; color: #006858; font-size: 11px; font-weight: 800; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px; margin-bottom: 16px; }
          .creds-box { background-color: #f1f5f9; border: 1px border #cbd5e1; border-left: 4px solid #006858; border-radius: 12px; padding: 18px 20px; margin: 24px 0; }
          .creds-box p { margin: 4px 0; font-size: 13px; font-family: monospace; }
          .creds-box strong { font-[#0f172a]; font-weight: 700; }
          .pwd-tag { background-color: #ffffff; padding: 4px 10px; border-radius: 6px; font-weight: bold; color: #006858; border: 1px solid #cbd5e1; font-size: 14px; }
          .cta-btn { display: block; width: 100%; text-align: center; background-color: #006858; color: #ffffff !important; font-weight: 800; text-decoration: none; padding: 14px 0; border-radius: 14px; font-size: 14px; margin-top: 24px; box-shadow: 0 4px 12px rgba(0,104,88,0.25); }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TaskConnect Workspace</h1>
            <p>Enterprise Project & Team Orchestration</p>
          </div>
          <div class="body-content">
            <span class="badge">${recipientLabel} Invitation</span>
            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a;">You're Invited to ${projectName || "a Workspace Project"}</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
              Hello <strong>${name}</strong>,<br>
              You have been added as a <strong>${role}</strong> on <strong>${projectName || "TaskConnect"}</strong>. Please accept your invitation below to activate your account and access the workspace.
            </p>

            <div class="creds-box">
              <p style="margin-bottom: 8px; font-[#0f172A]; font-weight: bold; font-family: sans-serif; font-size: 12px; text-transform: uppercase;">Your Auto-Generated Login Credentials</p>
              <p><strong>Email:</strong> ${email}</p>
              <p style="margin-top: 6px;"><strong>Temporary Password:</strong> <span class="pwd-tag">${autoPassword}</span></p>
            </div>

            <p style="font-size: 12px; color: #64748b;">
              Click the button below to accept your project invitation. Once accepted, your account will be activated and your workspace manager will be notified live.
            </p>

            <a href="${acceptLink}" class="cta-btn">Accept Project Invitation & Activate Account</a>
          </div>
          <div class="footer">
            Powered by IBWTECH • TaskConnect Secure Mail Service<br>
            If you did not expect this invitation, you may ignore this message.
          </div>
        </div>
      </body>
    </html>
  `;

  if (!user || !pass) {
    console.log(`\n======================================================`);
    console.log(`📧 [INVITATION MAIL GENERATED - NO SMTP USER CONFIGURED]`);
    console.log(`To: ${email} (${name})`);
    console.log(`Project: ${projectName}`);
    console.log(`Role: ${role} (${type})`);
    console.log(`Auto Password: ${autoPassword}`);
    console.log(`Accept Link: ${acceptLink}`);
    console.log(`======================================================\n`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: `🎉 You've been invited to ${projectName || "TaskConnect Project"} (${role})`,
      html: htmlContent,
    });

    console.log(`✅ [EMAIL SENT SUCCESSFULLY] To: ${email} for Project: ${projectName}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email via Nodemailer:", error);
    return false;
  }
}

interface SendOtpOptions {
  email: string;
  name: string;
  otp: string;
}

export async function sendVerificationOtpEmail(options: SendOtpOptions): Promise<boolean> {
  const { email, name, otp } = options;

  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"TaskConnect Security" <noreply@taskconnect.io>`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 0; }
          .container { max-width: 520px; margin: 30px auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #004d40 0%, #00897b 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 900; letter-spacing: -0.5px; }
          .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.85; }
          .body-content { padding: 32px 28px; text-align: center; }
          .otp-box { background-color: #e6f4f1; border: 2px dashed #006858; border-radius: 16px; padding: 20px; margin: 24px 0; display: inline-block; width: 80%; }
          .otp-code { font-size: 36px; font-weight: 900; font-family: monospace; letter-spacing: 10px; color: #006858; margin: 0; }
          .footer { background-color: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>TaskConnect Account Verification</h1>
            <p>6-Digit Email Verification Code</p>
          </div>
          <div class="body-content">
            <h2 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a;">Verify Your Account</h2>
            <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
              Hello <strong>${name}</strong>,<br>
              Thank you for signing up for TaskConnect! Please use the 6-digit verification code below to verify your email address and activate your workspace.
            </p>

            <div class="otp-box">
              <p class="otp-code">${otp}</p>
            </div>

            <p style="font-size: 12px; color: #64748b; margin-top: 16px;">
              This code will expire in 15 minutes. If you did not create a TaskConnect account, please ignore this email.
            </p>
          </div>
          <div class="footer">
            Powered by IBWTECH • TaskConnect Security Center
          </div>
        </div>
      </body>
    </html>
  `;

  if (!user || !pass) {
    console.log(`\n======================================================`);
    console.log(`📧 [OTP VERIFICATION MAIL GENERATED - NO SMTP USER CONFIGURED]`);
    console.log(`To: ${email} (${name})`);
    console.log(`6-Digit OTP: ${otp}`);
    console.log(`======================================================\n`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: `🔐 ${otp} is your TaskConnect email verification code`,
      html: htmlContent,
    });

    console.log(`✅ [OTP EMAIL SENT SUCCESSFULLY] To: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending OTP email via Nodemailer:", error);
    return false;
  }
}
