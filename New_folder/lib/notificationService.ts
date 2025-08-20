import type { NotificationLog, Tournament, Registration } from "@/lib/types";

// Mock WhatsApp API integration (replace with actual Twilio/Meta API)
class WhatsAppService {
  private apiKey: string;
  private phoneNumberId: string;

  constructor() {
    // In production, these would come from environment variables
    this.apiKey = process.env.WHATSAPP_API_KEY || "mock_key";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "mock_phone_id";
  }

  async sendMessage(phoneNumber: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Mock implementation - replace with actual WhatsApp API call
      console.log(`[WHATSAPP] Sending to ${phoneNumber}: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate 90% success rate
      const success = Math.random() > 0.1;
      
      if (success) {
        return { 
          success: true, 
          messageId: `msg_${Math.random().toString(36).slice(2, 10)}` 
        };
      } else {
        return { 
          success: false, 
          error: "WhatsApp delivery failed - rate limited" 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

// Mock email service (replace with actual email service like SendGrid, AWS SES)
class EmailService {
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || "mock_key";
    this.fromEmail = process.env.FROM_EMAIL || "noreply@sportsindia.com";
  }

  async sendEmail(toEmail: string, subject: string, message: string): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Mock implementation - replace with actual email service call
      console.log(`[EMAIL] Sending to ${toEmail}: ${subject}`);
      console.log(`[EMAIL] Message: ${message}`);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate 95% success rate
      const success = Math.random() > 0.05;
      
      if (success) {
        return { 
          success: true, 
          messageId: `email_${Math.random().toString(36).slice(2, 10)}` 
        };
      } else {
        return { 
          success: false, 
          error: "Email delivery failed - invalid email" 
        };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : "Unknown error" 
      };
    }
  }
}

export class NotificationService {
  private whatsappService: WhatsAppService;
  private emailService: EmailService;

  constructor() {
    this.whatsappService = new WhatsAppService();
    this.emailService = new EmailService();
  }

  async notifyTournamentDateScheduled(
    tournament: Tournament,
    participants: Registration[],
    adminUserId: string
  ): Promise<NotificationLog[]> {
    const notificationLogs: NotificationLog[] = [];
    const date = new Date(tournament.date!).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const whatsappMessage = `🎾 Tournament Update!\n\nYour tournament "${tournament.name}" is scheduled on ${date} at ${tournament.venue.name}, ${tournament.venue.city}.\n\nPlease check the tournament page for complete details and schedule.\n\nGood luck! 🏆`;
    
    const emailSubject = `Tournament Date Scheduled: ${tournament.name}`;
    const emailMessage = `Hello,\n\nYour tournament "${tournament.name}" has been scheduled!\n\n📅 Date: ${date}\n📍 Venue: ${tournament.venue.name}, ${tournament.venue.city}\n\nPlease visit the tournament page for complete details and schedule.\n\nBest regards,\nSports India Team`;

    // Send WhatsApp notifications first
    for (const participant of participants) {
      const whatsappResult = await this.whatsappService.sendMessage(
        participant.phone,
        whatsappMessage
      );

      const whatsappLog: NotificationLog = {
        id: `notif_${Math.random().toString(36).slice(2, 10)}`,
        tournamentId: tournament.id,
        participantId: participant.id,
        participantPhone: participant.phone,
        participantEmail: participant.email,
        notificationType: "whatsapp",
        status: whatsappResult.success ? "delivered" : "failed",
        message: whatsappMessage,
        sentAt: new Date().toISOString(),
        deliveredAt: whatsappResult.success ? new Date().toISOString() : undefined,
        failureReason: whatsappResult.success ? undefined : whatsappResult.error,
        retryCount: 0,
        adminUserId
      };

      notificationLogs.push(whatsappLog);

      // If WhatsApp failed, send email as fallback
      if (!whatsappResult.success) {
        const emailResult = await this.emailService.sendEmail(
          participant.email,
          emailSubject,
          emailMessage
        );

        const emailLog: NotificationLog = {
          id: `notif_${Math.random().toString(36).slice(2, 10)}`,
          tournamentId: tournament.id,
          participantId: participant.id,
          participantPhone: participant.phone,
          participantEmail: participant.email,
          notificationType: "email",
          status: emailResult.success ? "delivered" : "failed",
          message: emailMessage,
          sentAt: new Date().toISOString(),
          deliveredAt: emailResult.success ? new Date().toISOString() : undefined,
          failureReason: emailResult.success ? undefined : emailResult.error,
          retryCount: 0,
          adminUserId
        };

        notificationLogs.push(emailLog);
      }
    }

    return notificationLogs;
  }

  async retryFailedNotifications(
    failedLogs: NotificationLog[],
    adminUserId: string
  ): Promise<NotificationLog[]> {
    const retryLogs: NotificationLog[] = [];

    for (const log of failedLogs) {
      if (log.retryCount >= 3) continue; // Max 3 retries

      let result;
      if (log.notificationType === "whatsapp") {
        result = await this.whatsappService.sendMessage(log.participantPhone, log.message);
      } else {
        result = await this.emailService.sendEmail(log.participantEmail, "Tournament Update", log.message);
      }

      const retryLog: NotificationLog = {
        ...log,
        id: `retry_${Math.random().toString(36).slice(2, 10)}`,
        status: result.success ? "delivered" : "failed",
        sentAt: new Date().toISOString(),
        deliveredAt: result.success ? new Date().toISOString() : undefined,
        failureReason: result.success ? undefined : result.error,
        retryCount: log.retryCount + 1,
        adminUserId
      };

      retryLogs.push(retryLog);
    }

    return retryLogs;
  }
}

export const notificationService = new NotificationService();
