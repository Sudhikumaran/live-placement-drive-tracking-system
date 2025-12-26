import { query } from '../config/database';
import { getIO } from '../config/socket';
import { NotificationPayload, SocketEvent, UserRole } from '../sockets/types';

export class NotificationService {
    /**
     * Create and broadcast a notification to a specific user
     */
    async createAndBroadcast(notification: Omit<NotificationPayload, 'id' | 'createdAt' | 'isRead'>): Promise<void> {
        try {
            // 1. Save to database for persistence
            const result = await query(
                `INSERT INTO notifications (user_id, user_role, title, message, type, related_drive_id, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, false)
         RETURNING *`,
                [
                    notification.userId,
                    notification.userRole,
                    notification.title,
                    notification.message,
                    notification.type,
                    notification.relatedDriveId || null
                ]
            );

            const savedNotification: NotificationPayload = {
                id: result.rows[0].id,
                userId: result.rows[0].user_id,
                userRole: result.rows[0].user_role,
                title: result.rows[0].title,
                message: result.rows[0].message,
                type: result.rows[0].type,
                relatedDriveId: result.rows[0].related_drive_id,
                isRead: result.rows[0].is_read,
                createdAt: result.rows[0].created_at.toISOString()
            };

            // 2. Emit via Socket.IO to specific user
            const io = getIO();
            io.to(`user:${notification.userId}`).emit(
                SocketEvent.NOTIFICATION_NEW,
                savedNotification
            );

            console.log(`✅ Notification sent to user ${notification.userId}: ${notification.title}`);
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }

    /**
     * Create and broadcast notifications to multiple users
     */
    async createAndBroadcastBulk(notifications: Omit<NotificationPayload, 'id' | 'createdAt' | 'isRead'>[]): Promise<void> {
        try {
            const io = getIO();

            for (const notification of notifications) {
                await this.createAndBroadcast(notification);
            }

            console.log(`✅ Sent ${notifications.length} bulk notifications`);
        } catch (error) {
            console.error('Error creating bulk notifications:', error);
            throw error;
        }
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string, userId: string): Promise<boolean> {
        try {
            const result = await query(
                `UPDATE notifications 
         SET is_read = true 
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
                [notificationId, userId]
            );

            return result.rows.length > 0;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            throw error;
        }
    }

    /**
     * Get all notifications for a user
     */
    async getNotificationsForUser(userId: string, userRole: UserRole, limit = 50): Promise<NotificationPayload[]> {
        try {
            const result = await query(
                `SELECT * FROM notifications 
         WHERE user_id = $1 AND user_role = $2 
         ORDER BY created_at DESC 
         LIMIT $3`,
                [userId, userRole, limit]
            );

            return result.rows.map(row => ({
                id: row.id,
                userId: row.user_id,
                userRole: row.user_role,
                title: row.title,
                message: row.message,
                type: row.type,
                relatedDriveId: row.related_drive_id,
                isRead: row.is_read,
                createdAt: row.created_at.toISOString()
            }));
        } catch (error) {
            console.error('Error fetching notifications:', error);
            throw error;
        }
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string, userRole: UserRole): Promise<number> {
        try {
            const result = await query(
                `SELECT COUNT(*) as count FROM notifications 
         WHERE user_id = $1 AND user_role = $2 AND is_read = false`,
                [userId, userRole]
            );

            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw error;
        }
    }

    /**
     * Notification templates for common events
     */
    async notifyApplicationSubmitted(studentId: string, studentName: string, companyId: string, driveName: string, driveId: string): Promise<void> {
        await this.createAndBroadcast({
            userId: companyId,
            userRole: UserRole.COMPANY,
            title: 'New Application Received',
            message: `${studentName} has applied to ${driveName}`,
            type: 'APPLICATION_RECEIVED',
            relatedDriveId: driveId
        });
    }

    async notifyShortlistUpdate(
        studentId: string,
        studentName: string,
        companyName: string,
        driveName: string,
        driveId: string,
        roundNumber: number,
        roundName: string,
        status: string
    ): Promise<void> {
        const statusText = status === 'SELECTED' ? 'selected for' : 'not selected for';

        await this.createAndBroadcast({
            userId: studentId,
            userRole: UserRole.STUDENT,
            title: `Round ${roundNumber} Update - ${driveName}`,
            message: `You have been ${statusText} ${roundName} at ${companyName}`,
            type: 'SHORTLIST_UPDATE',
            relatedDriveId: driveId
        });
    }

    async notifyOfferCreated(studentId: string, companyName: string, driveName: string, driveId: string, ctc: number): Promise<void> {
        await this.createAndBroadcast({
            userId: studentId,
            userRole: UserRole.STUDENT,
            title: `Offer Received from ${companyName}!`,
            message: `Congratulations! You have received an offer for ${driveName} with CTC ₹${ctc} LPA`,
            type: 'OFFER_CREATED',
            relatedDriveId: driveId
        });
    }

    async notifyDriveCreated(studentIds: string[], companyName: string, driveName: string, driveId: string): Promise<void> {
        const notifications = studentIds.map(studentId => ({
            userId: studentId,
            userRole: UserRole.STUDENT,
            title: 'New Placement Drive',
            message: `${companyName} has opened a new drive: ${driveName}`,
            type: 'DRIVE_CREATED',
            relatedDriveId: driveId
        }));

        await this.createAndBroadcastBulk(notifications);
    }
}

export default new NotificationService();
