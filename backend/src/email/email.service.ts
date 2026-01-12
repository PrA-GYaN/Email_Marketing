import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: parseInt(this.configService.get('SMTP_PORT')),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(email: string, token: string) {
    const verificationUrl = `${this.configService.get('FRONTEND_URL')}/verify-email?token=${token}`;

    await this.transporter.sendMail({
      from: `"${this.configService.get('SMTP_FROM_NAME')}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to: email,
      subject: 'Verify Your Email - ViozonX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to ViozonX Email Marketing!</h2>
          <p>Please verify your email address by clicking the link below:</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p>Or copy and paste this link:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${token}`;

    await this.transporter.sendMail({
      from: `"${this.configService.get('SMTP_FROM_NAME')}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to: email,
      subject: 'Reset Your Password - ViozonX',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>You requested to reset your password. Click the link below:</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
          <p>Or copy and paste this link:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
  }

  async sendCampaignEmail(
    to: string,
    subject: string,
    html: string,
    senderName: string,
    senderEmail: string,
    unsubscribeUrl: string,
    companyAddress: string,
    trackingData?: {
      campaignId: string;
      recipientId: string;
      recipientEmail: string;
    },
    contactData?: {
      firstName?: string;
      lastName?: string;
      email: string;
    },
  ) {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    
    // Add tracking pixel for open tracking
    const trackingPixel = trackingData ? 
      `<img src="${frontendUrl}/api/analytics/open?cid=${trackingData.campaignId}&rid=${trackingData.recipientId}" width="1" height="1" style="display:none;" alt="" />` : '';

    // Personalize content with contact data
    let personalizedHtml = html;
    let personalizedSubject = subject;

    if (contactData) {
      personalizedHtml = this.personalizeContent(html, contactData);
      personalizedSubject = this.personalizeContent(subject, contactData);
    }

    // Replace unsubscribe link placeholder with actual URL
    personalizedHtml = personalizedHtml.replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, `<a href="${unsubscribeUrl}" style="color: #4F46E5;">Unsubscribe</a>`);
    
    // Also try alternative formats in case the HTML has different formatting
    personalizedHtml = personalizedHtml.replace(/\{\{\s*UNSUBSCRIBE_LINK\s*\}\}/g, `<a href="${unsubscribeUrl}" style="color: #4F46E5;">Unsubscribe</a>`);
    
    // Try literal string replacement as fallback
    if (personalizedHtml.includes('{{UNSUBSCRIBE_LINK}}')) {
      personalizedHtml = personalizedHtml.split('{{UNSUBSCRIBE_LINK}}').join(`<a href="${unsubscribeUrl}" style="color: #4F46E5;">Unsubscribe</a>`);
    }

    // Check if the HTML already contains an unsubscribe link BEFORE adding click tracking
    const hasUnsubscribeLink = personalizedHtml.includes(unsubscribeUrl);

    // Process HTML to add click tracking to links (but skip unsubscribe links)
    if (trackingData) {
      personalizedHtml = this.addClickTracking(personalizedHtml, trackingData, unsubscribeUrl);
    }

    // Only add default footer if template doesn't already have unsubscribe link
    const footerHtml = hasUnsubscribeLink ? '' : `
      <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
        <p><a href="${unsubscribeUrl}" style="color: #4F46E5;">Unsubscribe</a> from these emails</p>
        <p>${companyAddress || 'ViozonX Email Marketing'}</p>
      </div>
    `;

    const emailHtml = `
      ${personalizedHtml}
      ${trackingPixel}
      ${footerHtml}
    `;

    return this.transporter.sendMail({
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject: personalizedSubject,
      html: emailHtml,
    });
  }

  private personalizeContent(content: string, contactData: { firstName?: string; lastName?: string; email: string }): string {
    let personalized = content;

    // Replace merge tags with contact data
    const mergeTags = {
      '{Name}': contactData.firstName || contactData.email.split('@')[0], // Fallback to email prefix
      '{FirstName}': contactData.firstName || '',
      '{LastName}': contactData.lastName || '',
      '{Email}': contactData.email,
      '{First Name}': contactData.firstName || '',
      '{Last Name}': contactData.lastName || '',
      '{Full Name}': [contactData.firstName, contactData.lastName].filter(Boolean).join(' ') || contactData.email.split('@')[0],
    };

    // Replace all merge tags
    Object.entries(mergeTags).forEach(([tag, value]) => {
      personalized = personalized.replace(new RegExp(tag, 'g'), value);
    });

    return personalized;
  }

  private addClickTracking(html: string, trackingData: any, excludeUrl?: string): string {
    const frontendUrl = this.configService.get('FRONTEND_URL');
    
    // Simple regex to find and replace links
    // This is basic - a production system would use a proper HTML parser
    return html.replace(
      /href="([^"]+)"/g, 
      (match, url) => {
        // Skip tracking for excluded URLs (like unsubscribe links)
        if (excludeUrl && url === excludeUrl) {
          return match;
        }
        
        const trackingUrl = `${frontendUrl}/api/analytics/click?cid=${trackingData.campaignId}&rid=${trackingData.recipientId}&url=${encodeURIComponent(url)}`;
        return `href="${trackingUrl}"`;
      }
    );
  }

  async sendTestEmail(to: string, subject: string, html: string, contactData?: { firstName?: string; lastName?: string; email: string }) {
    // Personalize test email content
    let personalizedHtml = html;
    let personalizedSubject = subject;

    if (contactData) {
      personalizedHtml = this.personalizeContent(html, contactData);
      personalizedSubject = this.personalizeContent(subject, contactData);
    }

    // Replace unsubscribe link placeholder with a test URL
    const testUnsubscribeUrl = `${this.configService.get('FRONTEND_URL')}/unsubscribe?email=${encodeURIComponent(to)}&test=true`;
    personalizedHtml = personalizedHtml.replace(/\{\{UNSUBSCRIBE_LINK\}\}/g, `<a href="${testUnsubscribeUrl}" style="color: #4F46E5;">Unsubscribe</a>`);

    await this.transporter.sendMail({
      from: `"${this.configService.get('SMTP_FROM_NAME')}" <${this.configService.get('SMTP_FROM_EMAIL')}>`,
      to,
      subject: `[TEST] ${personalizedSubject}`,
      html: `
        <div style="padding: 20px; background-color: #fef3c7; border: 2px solid #f59e0b; margin-bottom: 20px;">
          <strong>⚠️ THIS IS A TEST EMAIL</strong>
          <br>
          <small>Personalized with sample data: ${contactData ? `Name: ${contactData.firstName} ${contactData.lastName}, Email: ${contactData.email}` : 'No personalization'}</small>
        </div>
        ${personalizedHtml}
        <div style="margin-top: 40px; padding: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          <p><a href="${testUnsubscribeUrl}" style="color: #4F46E5;">Unsubscribe</a> from these emails</p>
          <p>ViozonX Email Marketing - Test Email</p>
        </div>
      `,
    });
  }
}
