const logger = require('./logger');

class SocketManager {
  constructor(io) {
    this.io = io;
    this.connectedUsers = new Map(); // userId -> socketId
    this.userRoles = new Map(); // socketId -> role
  }

  // Initialize socket event handlers
  initialize() {
    this.io.on('connection', (socket) => {
      logger.info(`User connected: ${socket.id}`);

      // Handle user authentication and role assignment
      socket.on('authenticate', (data) => {
        const { userId, role, name } = data;
        this.connectedUsers.set(userId, socket.id);
        this.userRoles.set(socket.id, { role, userId, name });
        
        // Join role-based room
        socket.join(role);
        socket.join(`user_${userId}`);
        
        logger.info(`User ${name} (${userId}) authenticated with role ${role}`);
        
        // Notify user of successful authentication
        socket.emit('authenticated', { success: true, role });
      });

      // Handle emergency alerts
      socket.on('emergency-alert', (data) => {
        this.broadcastEmergencyAlert(data);
      });

      // Handle vitals updates
      socket.on('vitals-update', (data) => {
        this.broadcastVitalsUpdate(data);
      });

      // Handle incident updates
      socket.on('incident-update', (data) => {
        this.broadcastIncidentUpdate(data);
      });

      // Handle assignment updates
      socket.on('assignment-update', (data) => {
        this.broadcastAssignmentUpdate(data);
      });

      // Handle dashboard metric updates
      socket.on('dashboard-update', (data) => {
        this.broadcastDashboardUpdate(data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnection(socket);
      });
    });
  }

  // Broadcast emergency alert to all users
  broadcastEmergencyAlert(data) {
    logger.info('Broadcasting emergency alert:', data);
    
    // Send to all caregivers and admins
    this.io.to('admin').emit('emergency-alert', {
      ...data,
      timestamp: new Date(),
      type: 'emergency'
    });
    
    this.io.to('caregiver').emit('emergency-alert', {
      ...data,
      timestamp: new Date(),
      type: 'emergency'
    });
  }

  // Broadcast vitals update
  broadcastVitalsUpdate(data) {
    logger.info('Broadcasting vitals update:', data);
    
    // Send to all users
    this.io.emit('vitals-update', {
      ...data,
      timestamp: new Date(),
      type: 'vitals'
    });
  }

  // Broadcast incident update
  broadcastIncidentUpdate(data) {
    logger.info('Broadcasting incident update:', data);
    
    const updateData = {
      ...data,
      timestamp: new Date(),
      type: 'incident'
    };

    // Send to all users for incident updates
    this.io.emit('incident-update', updateData);
    
    // Send specific notifications based on incident status
    if (data.status === 'active') {
      this.io.to('caregiver').emit('incident-notification', {
        ...updateData,
        message: `New ${data.incidentType} incident for ${data.residentName}`,
        priority: 'high'
      });
    }
  }

  // Broadcast assignment update
  broadcastAssignmentUpdate(data) {
    logger.info('Broadcasting assignment update:', data);
    
    const updateData = {
      ...data,
      timestamp: new Date(),
      type: 'assignment'
    };

    // Send to admins
    this.io.to('admin').emit('assignment-update', updateData);
    
    // Send to specific caregiver if they're connected
    if (data.caregiverId) {
      this.io.to(`user_${data.caregiverId}`).emit('assignment-notification', {
        ...updateData,
        message: `You have been assigned to ${data.residentName}`,
        priority: 'medium'
      });
    }
  }

  // Broadcast dashboard metrics update
  broadcastDashboardUpdate(data) {
    logger.info('Broadcasting dashboard update:', data);
    
    this.io.emit('dashboard-update', {
      ...data,
      timestamp: new Date(),
      type: 'dashboard'
    });
  }

  // Send notification to specific user
  sendToUser(userId, event, data) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
      logger.info(`Sent ${event} to user ${userId}`);
    } else {
      logger.warn(`User ${userId} not connected, cannot send ${event}`);
    }
  }

  // Send notification to all users with specific role
  sendToRole(role, event, data) {
    this.io.to(role).emit(event, data);
    logger.info(`Sent ${event} to all ${role}s`);
  }

  // Get connected users count by role
  getConnectedUsersCount() {
    const counts = { admin: 0, caregiver: 0, total: 0 };
    
    this.userRoles.forEach((userData) => {
      counts[userData.role]++;
      counts.total++;
    });
    
    return counts;
  }

  // Handle user disconnection
  handleDisconnection(socket) {
    const userData = this.userRoles.get(socket.id);
    
    if (userData) {
      this.connectedUsers.delete(userData.userId);
      this.userRoles.delete(socket.id);
      
      logger.info(`User ${userData.name} (${userData.userId}) disconnected`);
      
      // Notify other users about disconnection if needed
      this.io.to(userData.role).emit('user-disconnected', {
        userId: userData.userId,
        name: userData.name,
        role: userData.role,
        timestamp: new Date()
      });
    } else {
      logger.info(`Unknown user disconnected: ${socket.id}`);
    }
  }

  // Send system notification
  sendSystemNotification(message, priority = 'info', targetRole = null) {
    const notification = {
      message,
      priority,
      timestamp: new Date(),
      type: 'system'
    };

    if (targetRole) {
      this.io.to(targetRole).emit('system-notification', notification);
    } else {
      this.io.emit('system-notification', notification);
    }
    
    logger.info(`System notification sent: ${message}`);
  }

  // Send overdue vitals alert
  sendOverdueVitalsAlert(residents) {
    const alert = {
      type: 'overdue-vitals',
      residents,
      timestamp: new Date(),
      priority: 'medium',
      message: `${residents.length} resident(s) have overdue vitals checks`
    };

    this.io.to('caregiver').emit('overdue-vitals-alert', alert);
    this.io.to('admin').emit('overdue-vitals-alert', alert);
    
    logger.info(`Overdue vitals alert sent for ${residents.length} residents`);
  }
}

module.exports = SocketManager;