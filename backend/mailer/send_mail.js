const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');

// Load .env from backend/.env silently
try {
  dotenv.config({ path: path.resolve(__dirname, '../.env'), quiet: true });
  dotenv.config({ quiet: true });
} catch (e) {}

function isProduction() {
  const env = (process.env.ENVIRONMENT || process.env.NODE_ENV || '').toLowerCase().trim();
  return env === 'production' || env === 'prod' || Boolean(process.env.RENDER);
}

function sanitizeError(msg, secret) {
  if (!msg) return 'Unknown email error';
  let sanitized = String(msg);
  if (secret && typeof secret === 'string' && secret.length > 2) {
    sanitized = sanitized.split(secret).join('****');
  }
  return sanitized;
}

async function getTransporter() {
  const smtpUser = process.env.SMTP_USER || process.env.SMTP_EMAIL;
  const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;

  if (smtpUser && smtpPass) {
    const isGmail = smtpUser.includes('@gmail');
    const host = process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : 'smtp.office365.com');
    const port = parseInt(process.env.SMTP_PORT || '587');
    const secure = port === 465 || process.env.SMTP_SECURE === 'true';

    let fromAddress = process.env.SMTP_FROM || `"JanSamadhan Grievance Cell" <${smtpUser}>`;
    if (isGmail && fromAddress.includes('@jansamadhan.gov.in')) {
      fromAddress = `"JanSamadhan Grievance Cell" <${smtpUser}>`;
    }

    // For Gmail, service: 'gmail' provides optimal SSL/TLS on port 465
    const transportOptions = isGmail
      ? {
          service: 'gmail',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        }
      : {
          host,
          port,
          secure,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        };

    return {
      transporter: nodemailer.createTransport(transportOptions),
      from: fromAddress,
      isEthereal: false
    };
  }

  // Strict Production Safety: Never use Ethereal in production
  if (isProduction()) {
    throw new Error(
      'SMTP Configuration Error: SMTP_USER and SMTP_PASS environment variables are required in production. Ethereal fallback is strictly disabled in production.'
    );
  }

  // Fallback to auto-created Ethereal test account ONLY in development / testing
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass
    }
  });

  return {
    transporter,
    from: '"JanSamadhan Grievance Cell" <no-reply@jansamadhan.gov.in>',
    isEthereal: true
  };
}


function generateOtpHtml(name, otp) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>JanSamadhan OTP Verification</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px;">
    <div style="max-width: 540px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0;">
      
      <!-- Header -->
      <div style="background-color: #0f172a; padding: 24px; text-align: center; border-bottom: 4px solid #f97316;">
        <div style="display: inline-block; background-color: #1e3a8a; color: #ffffff; font-weight: 800; font-size: 20px; padding: 10px 16px; border-radius: 10px; margin-bottom: 8px;">
          JS
        </div>
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800;">JanSamadhan</h1>
        <p style="color: #94a3b8; margin: 4px 0 0; font-size: 12px; letter-spacing: 0.5px;">National Public Grievance Redressal Portal</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px 24px;">
        <p style="font-size: 15px; color: #334155; margin-top: 0;">
          Namaste <strong>${name || 'Citizen'}</strong>,
        </p>
        <p style="font-size: 14px; color: #475569; line-height: 1.6;">
          Aapke JanSamadhan portal login ya registration ke liye verification OTP code niche diya gaya hai:
        </p>

        <!-- OTP Highlight Box -->
        <div style="background: linear-gradient(135deg, #eff6ff 0%, #f0fdfa 100%); border: 2px dashed #0f766e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0;">
          <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #0f766e; letter-spacing: 1px; display: block; margin-bottom: 6px;">Your Security Verification OTP</span>
          <span style="font-family: 'Courier New', monospace; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #0f172a; display: block; padding: 4px 0;">
            ${otp}
          </span>
          <span style="font-size: 11px; color: #64748b; display: block; margin-top: 6px;">
            Valid for 10 minutes only. Do not share with anyone.
          </span>
        </div>

        <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
          Agar aapne yeh OTP request nahi kiya tha, toh kripya is email ko ignore karein. Aapka account surakshit hai.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f1f5f9; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        Government of India | Citizen Grievance Cell | JanSamadhan v2.0
      </div>
    </div>
  </body>
  </html>
  `;
}

function generateComplaintHtml(name, complaint) {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Complaint Registered - ${complaint.id}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 24px;">
    <div style="max-width: 560px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; border-bottom: 4px solid #f97316;">
        <h2 style="color: #ffffff; margin: 0; font-size: 20px;">Grievance Registered Successfully</h2>
        <p style="color: #38bdf8; margin: 4px 0 0; font-size: 12px; font-family: monospace;">Tracking ID: ${complaint.id}</p>
      </div>
      <div style="padding: 24px;">
        <p style="color: #334155; font-size: 14px;">Namaste <strong>${name || 'Citizen'}</strong>,</p>
        <p style="color: #475569; font-size: 13px; line-height: 1.5;">
          Aapki shikayat JanSamadhan portal par safaltapoorvak darj ho chuki hai. AI triage engine ne ise classify karke sambandhit vibhaag ko forward kar diya hai.
        </p>
        <table style="width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b; font-weight: bold;">Title:</td>
            <td style="padding: 8px 0; color: #0f172a; font-weight: bold;">${complaint.title || complaint.category}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Department:</td>
            <td style="padding: 8px 0; color: #0f766e; font-weight: bold;">${complaint.department}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px 0; color: #64748b;">Priority:</td>
            <td style="padding: 8px 0; color: #ea580c; font-weight: bold;">${complaint.priority}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #64748b;">Location:</td>
            <td style="padding: 8px 0; color: #334155;">${complaint.location_address || 'Pinned on Map'}</td>
          </tr>
        </table>
        <p style="color: #64748b; font-size: 12px;">Aap apne portal par login karke real-time redressal progress track kar sakte hain.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

async function sendEmail({ to, type = 'otp', otp, name = 'Citizen', complaint = {} }) {
  try {
    let { transporter, from, isEthereal } = await getTransporter();

    let subject = '';
    let html = '';

    if (type === 'complaint') {
      subject = `[JanSamadhan] Grievance Registered - Tracking ID: ${complaint.id || 'JS-2026'}`;
      html = generateComplaintHtml(name, complaint);
    } else {
      subject = `[JanSamadhan] Verification Code: ${otp}`;
      html = generateOtpHtml(name, otp);
    }

    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html
      });

      const previewUrl = isEthereal ? nodemailer.getTestMessageUrl(info) : null;

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        isEthereal,
        recipient: to
      };
    } catch (primaryErr) {
      const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
      const safeErrorMsg = sanitizeError(primaryErr.message, smtpPass);
      console.warn('[Nodemailer Primary Error]:', safeErrorMsg);

      // Automatic fallback to ethereal test account ONLY in development / testing
      if (!isProduction() && !isEthereal) {
        try {
          const testAccount = await nodemailer.createTestAccount();
          const fallbackTransporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass
            }
          });

          const fallbackInfo = await fallbackTransporter.sendMail({
            from: `"JanSamadhan Grievance Cell" <${testAccount.user}>`,
            to,
            subject,
            html
          });

          const previewUrl = nodemailer.getTestMessageUrl(fallbackInfo);
          return {
            success: true,
            fallbackUsed: true,
            messageId: fallbackInfo.messageId,
            previewUrl,
            isEthereal: true,
            recipient: to
          };
        } catch (fallbackErr) {
          return {
            success: false,
            error: safeErrorMsg
          };
        }
      }

      return {
        success: false,
        error: safeErrorMsg
      };
    }
  } catch (err) {
    const smtpPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD;
    return {
      success: false,
      error: sanitizeError(err.message, smtpPass)
    };
  }
}

// CLI handler for python / subprocess execution
if (require.main === module) {
  const args = process.argv.slice(2);
  let payload = {};

  const fullArgString = args.join(' ').trim();
  if (fullArgString.startsWith('{') && fullArgString.endsWith('}')) {
    try {
      payload = JSON.parse(fullArgString);
    } catch (e) {
      payload = {};
    }
  } else if (args.length === 1 && args[0].startsWith('{')) {
    try {
      payload = JSON.parse(args[0]);
    } catch (e) {
      payload = {};
    }
  } else {
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].replace(/^--/, '');
      const val = args[i + 1];
      payload[key] = val;
    }
  }

  if (!payload.to) {
    console.error(JSON.stringify({ success: false, error: "Recipient '--to' is required." }));
    process.exit(1);
  }

  sendEmail(payload).then((res) => {
    console.log(JSON.stringify(res));
    process.exit(res.success ? 0 : 1);
  });
}


module.exports = { sendEmail, getTransporter };
