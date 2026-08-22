export interface EmailOptions {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export async function sendBrevoEmail(options: EmailOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.log(`[Email Brevo Simulation] To: ${options.toEmail} | Subject: "${options.subject}"`);
    return true;
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        sender: {
          name: 'My Food Scanner',
          email: 'contact@myfoodscanner.com',
        },
        to: [
          {
            email: options.toEmail,
            name: options.toName || options.toEmail,
          },
        ],
        subject: options.subject,
        htmlContent: options.htmlContent,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.warn('Brevo API email failed:', err);
      return false;
    }
    return true;
  } catch (error) {
    console.error('Error sending Brevo email:', error);
    return false;
  }
}

// 1. Welcome Email
export async function sendWelcomeEmail(email: string, name: string) {
  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Welcome to My Food Scanner!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; background-color: #1a3a1a; color: #ffffff; padding: 24px; border-radius: 8px;">
        <h1 style="color: #4caf50;">Welcome to My Food Scanner, ${name}!</h1>
        <p>You have taken the first step towards clean, safe food for you and your loved ones.</p>
        <p>With our multi-dimensional AI scanning engine, you will instantly detect:</p>
        <ul>
          <li>Hidden toxic additives & controversial E-numbers</li>
          <li>Hormone-disrupting endocrine chemicals</li>
          <li>Allergens & ultra-processing NOVA scores</li>
          <li>Immediate healthier 90+ rated alternatives</li>
        </ul>
        <p><a href="https://myfoodscanner.com/dashboard/scan" style="display:inline-block; background-color: #4caf50; color:#ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 12px;">Go to My Account</a></p>
      </div>
    `,
  });
}

// 2. Payment Confirmed Email
export async function sendPaymentConfirmedEmail(email: string, name: string, plan: string, amount: number) {
  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Your subscription is now active — scan smarter!',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; background-color: #1a3a1a; color: #ffffff; padding: 24px; border-radius: 8px;">
        <h1 style="color: #10b981;">Payment Confirmed ✅</h1>
        <p>Hello ${name},</p>
        <p>Your <strong>${plan === 'annual' ? 'Annual Pro Plan ($29.99/yr)' : 'Monthly Pro Plan ($4.99/mo)'}</strong> is now officially active.</p>
        <p>You now have unlimited access to:</p>
        <ul>
          <li>Unlimited AI Label Scanning with Gemini Vision</li>
          <li>Personalized Family & Health Alerts (Children, Pregnancy, Diabetes)</li>
          <li>Detailed Additives & Endocrine Disruptors Breakdown</li>
          <li>Full Scan History with Export capability</li>
        </ul>
        <p><a href="https://myfoodscanner.com/dashboard/scan" style="display:inline-block; background-color: #4caf50; color:#ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Scanning Food Labels</a></p>
      </div>
    `,
  });
}

// 3. Cancellation Confirmed Email
export async function sendCancellationConfirmedEmail(email: string, name: string, activeUntil: string) {
  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Your subscription has been cancelled',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; background-color: #1a3a1a; color: #ffffff; padding: 24px; border-radius: 8px;">
        <h2 style="color: #ff9800;">Subscription Cancellation Confirmed</h2>
        <p>Hello ${name},</p>
        <p>We confirm that your auto-renewal has been successfully cancelled. You will not be charged again.</p>
        <p>You will retain full Pro scanning access until the end of your billing cycle: <strong>${new Date(activeUntil).toLocaleDateString()}</strong>.</p>
        <p>We hope to see you back soon protecting your food quality!</p>
      </div>
    `,
  });
}

// 4. Weekly Food Safety Alert Email
export async function sendWeeklyFoodSafetyTip(email: string, name: string) {
  return sendBrevoEmail({
    toEmail: email,
    toName: name,
    subject: 'Your weekly food safety alert',
    htmlContent: `
      <div style="font-family: Arial, sans-serif; background-color: #1a3a1a; color: #ffffff; padding: 24px; border-radius: 8px;">
        <h2 style="color: #4caf50;">🛡️ Weekly Food Safety Alert — My Food Scanner</h2>
        <p>Hello ${name},</p>
        <div style="background-color: #241414; border-left: 4px solid #e53935; padding: 12px; margin: 16px 0;">
          <h3 style="color: #e53935; margin: 0 0 8px 0;">Additive of the Week: E250 (Sodium Nitrite)</h3>
          <p style="margin: 0;">Frequently found in packaged deli meats, ham, and sausages. Classified as a probable carcinogen by WHO/IARC due to the formation of nitrosamines in the digestive tract.</p>
        </div>
        <h3>Safe Healthier Alternative:</h3>
        <p>Choose products labeled <em>"Conservation sans nitrite"</em> (cured with natural vegetable broths like celery juice) or fresh poultry cuts.</p>
        <p><a href="https://myfoodscanner.com/dashboard/scan" style="display:inline-block; background-color: #4caf50; color:#ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Scan Your Next Grocery Item</a></p>
      </div>
    `,
  });
}
