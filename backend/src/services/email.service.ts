import { Resend } from "resend";
import { VerificationEmailTemplate } from "../mail/verification-template";

export class EmailService {
  private static resend: Resend | null = null;

  private static getClient(): Resend | null {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) return null;
    if (!this.resend) {
      this.resend = new Resend(key);
    }
    return this.resend;
  }

  static async sendEmail(to: string, subject: string, html: string) {
    const client = this.getClient();
    if (!client) {
      console.warn(
        `[EmailService] RESEND_API_KEY is not configured in environment. Confirmation email to ${to} with subject "${subject}" was skipped.`
      );
      return;
    }

    const from = process.env.EMAIL_FROM?.trim() || "JS Ashanti <onboarding@resend.dev>";

    try {
      console.log(`[EmailService] Sending email to ${to} with subject: "${subject}"...`);
      const response = await client.emails.send({
        from,
        to,
        subject,
        html,
      });

      if (response.error) {
        console.error(`[EmailService] Resend returned an error for ${to}:`, response.error);
        return;
      }

      console.log(`[EmailService] Email successfully sent to ${to} (Message ID: ${response.data?.id})`);
    } catch (err) {
      console.error(`[EmailService] Exception while sending email to ${to}:`, err);
    }
  }

  static async sendVerificationEmail(url: string, user: any) {
    const html = VerificationEmailTemplate({ url, name: user.name });
    await this.sendEmail(user.email, "Verify your email", html);
  }
}
