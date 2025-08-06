const cron = require('node-cron');
const Resident = require('../models/Resident');
const Vitals = require('../models/Vitals');
const logger = require('./logger');

class Scheduler {
  constructor(socketManager) {
    this.socketManager = socketManager;
  }

  // Initialize all scheduled tasks
  initialize() {
    this.scheduleOverdueVitalsCheck();
    this.scheduleHealthScoreUpdates();
    this.scheduleDashboardMetricsUpdate();
    
    logger.info('Scheduler initialized with all tasks');
  }

  // Check for overdue vitals every 30 minutes
  scheduleOverdueVitalsCheck() {
    cron.schedule('*/30 * * * *', async () => {
      try {
        await this.checkOverdueVitals();
      } catch (error) {
        logger.error('Error in overdue vitals check:', error);
      }
    });
    
    logger.info('Overdue vitals check scheduled (every 30 minutes)');
  }

  // Update health scores every hour
  scheduleHealthScoreUpdates() {
    cron.schedule('0 * * * *', async () => {
      try {
        await this.updateHealthScores();
      } catch (error) {
        logger.error('Error in health score update:', error);
      }
    });
    
    logger.info('Health score updates scheduled (every hour)');
  }

  // Update dashboard metrics every 5 minutes
  scheduleDashboardMetricsUpdate() {
    cron.schedule('*/5 * * * *', async () => {
      try {
        await this.updateDashboardMetrics();
      } catch (error) {
        logger.error('Error in dashboard metrics update:', error);
      }
    });
    
    logger.info('Dashboard metrics updates scheduled (every 5 minutes)');
  }

  // Check for residents with overdue vitals
  async checkOverdueVitals() {
    const now = new Date();
    const eightHoursAgo = new Date(now.getTime() - 8 * 60 * 60 * 1000);
    
    const overdueResidents = await Resident.aggregate([
      {
        $lookup: {
          from: 'vitals',
          localField: '_id',
          foreignField: 'residentId',
          as: 'vitals'
        }
      },
      {
        $addFields: {
          lastVitals: {
            $max: '$vitals.timestamp'
          }
        }
      },
      {
        $match: {
          $or: [
            { lastVitals: { $lt: eightHoursAgo } },
            { lastVitals: { $exists: false } }
          ]
        }
      },
      {
        $project: {
          name: 1,
          room: 1,
          lastVitals: 1,
          hoursOverdue: {
            $divide: [
              { $subtract: [now, { $ifNull: ['$lastVitals', new Date(0)] }] },
              1000 * 60 * 60
            ]
          }
        }
      }
    ]);

    if (overdueResidents.length > 0) {
      logger.info(`Found ${overdueResidents.length} residents with overdue vitals`);
      this.socketManager.sendOverdueVitalsAlert(overdueResidents);
    }
  }

  // Update health scores for all residents
  async updateHealthScores() {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const healthScores = await Resident.aggregate([
      {
        $lookup: {
          from: 'vitals',
          localField: '_id',
          foreignField: 'residentId',
          as: 'vitals'
        }
      },
      {
        $lookup: {
          from: 'incidents',
          localField: '_id',
          foreignField: 'residentId',
          as: 'incidents'
        }
      },
      {
        $addFields: {
          recentVitals: {
            $filter: {
              input: '$vitals',
              cond: { $gte: ['$$this.timestamp', weekAgo] }
            }
          },
          recentIncidents: {
            $filter: {
              input: '$incidents',
              cond: { $gte: ['$$this.detectionTime', weekAgo] }
            }
          },
          lastVitals: {
            $max: '$vitals.timestamp'
          }
        }
      },
      {
        $addFields: {
          vitalsFrequency: { $size: '$recentVitals' },
          incidentCount: { $size: '$recentIncidents' },
          daysSinceLastVitals: {
            $divide: [
              { $subtract: [now, '$lastVitals'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $addFields: {
          healthScore: {
            $max: [
              0,
              {
                $subtract: [
                  100,
                  {
                    $add: [
                      { $multiply: ['$incidentCount', 10] },
                      { $multiply: [{ $max: [0, { $subtract: ['$daysSinceLastVitals', 1] }] }, 5] },
                      { $cond: [{ $lt: ['$vitalsFrequency', 7] }, { $multiply: [{ $subtract: [7, '$vitalsFrequency'] }, 3] }, 0] }
                    ]
                  }
                ]
              }
            ]
          }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          room: 1,
          healthScore: { $round: ['$healthScore', 1] }
        }
      }
    ]);

    // Broadcast health score updates
    this.socketManager.broadcastDashboardUpdate({
      type: 'health-scores',
      data: healthScores
    });

    logger.info(`Updated health scores for ${healthScores.length} residents`);
  }

  // Update dashboard metrics
  async updateDashboardMetrics() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get basic counts
    const totalResidents = await Resident.countDocuments();
    const vitalsToday = await Vitals.countDocuments({ 
      timestamp: { $gte: today } 
    });

    // Get connected users count
    const connectedUsers = this.socketManager.getConnectedUsersCount();

    const metrics = {
      totalResidents,
      vitalsToday,
      connectedUsers,
      lastUpdated: now
    };

    // Broadcast metrics update
    this.socketManager.broadcastDashboardUpdate({
      type: 'metrics',
      data: metrics
    });

    logger.debug('Dashboard metrics updated');
  }

  // Manual trigger for overdue vitals check (for testing)
  async triggerOverdueVitalsCheck() {
    await this.checkOverdueVitals();
  }

  // Manual trigger for health score update (for testing)
  async triggerHealthScoreUpdate() {
    await this.updateHealthScores();
  }
}

module.exports = Scheduler;