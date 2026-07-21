export interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class MailService {
  static async sendMail(options: MailOptions): Promise<void> {
    // Abstracted MailService interface. logs to console.
    console.log('============= [MAIL SERVICE] EMAIL OUTBOUND =============');
    console.log(`TO:      ${options.to}`);
    console.log(`SUBJECT: ${options.subject}`);
    console.log(`BODY:    ${options.text}`);
    if (options.html) {
      console.log(`HTML:    Included (Length: ${options.html.length} chars)`);
    }
    console.log('========================================================');
  }

  static async sendStatusUpdate(to: string, customerName: string, ticketNumber: string, status: string, notes?: string): Promise<void> {
    await this.sendMail({
      to,
      subject: `Repair Update for Ticket ${ticketNumber} - ${status}`,
      text: `Hello ${customerName},\n\nYour repair ticket ${ticketNumber} is now: ${status}.\n${notes ? `Technician notes: ${notes}\n` : ''}\nTrack your status live: ${process.env.APP_URL || 'http://localhost:3000'}/track?ticket=${ticketNumber}\n\nThank you,\nRepairHub Pro Support`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #2563eb;">Repair Status Updated</h2>
          <p>Hello <strong>${customerName}</strong>,</p>
          <p>Your repair ticket <strong>${ticketNumber}</strong> has been updated to status: <span style="font-weight: bold; color: #2563eb; background-color: #eff6ff; padding: 2px 8px; border-radius: 4px;">${status}</span>.</p>
          ${notes ? `<p style="background: #f3f4f6; padding: 10px; border-left: 4px solid #cbd5e1;"><em>Technician Notes: ${notes}</em></p>` : ''}
          <div style="margin-top: 25px;">
            <a href="${process.env.APP_URL || 'http://localhost:3000'}/track?ticket=${ticketNumber}" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Track Repair Live</a>
          </div>
          <p style="margin-top: 25px; font-size: 12px; color: #666;">This is an automated notification from RepairHub Pro.</p>
        </div>
      `
    });
  }
}
