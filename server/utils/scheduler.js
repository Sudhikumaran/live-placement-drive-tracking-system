import cron from 'node-cron';
import PlacementDrive from '../models/PlacementDrive.js';

// Close drives automatically once the deadline has passed
const closeExpiredDrives = async () => {
  const now = new Date();
  try {
    const result = await PlacementDrive.updateMany(
      { status: { $ne: 'closed' }, deadline: { $lt: now } },
      { $set: { status: 'closed' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`⏰ Auto-closed ${result.modifiedCount} drive(s) past deadline.`);
    }
  } catch (err) {
    console.error('Scheduler error while closing expired drives:', err.message);
  }
};

export const startSchedulers = () => {
  // Run at minute 0 every hour
  cron.schedule('0 * * * *', async () => {
    await closeExpiredDrives();
  });

  // Also run once on startup
  closeExpiredDrives();
};

export default startSchedulers;