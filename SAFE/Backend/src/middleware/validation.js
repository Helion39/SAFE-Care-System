const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    console.log('🔍 Validating request body:', JSON.stringify(req.body, null, 2));
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      console.log('❌ Validation failed:', errorMessage);
      console.log('❌ Validation error details:', JSON.stringify(error.details, null, 2));
      logger.warn('Validation error:', errorMessage);
      
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errorMessage
      });
    }
    
    console.log('✅ Validation passed');
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    username: Joi.string().min(3).max(20).required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'caregiver').required()
  }),
  
  login: Joi.object({
    email: Joi.string().email(),
    username: Joi.string().min(3).max(20),
    password: Joi.string().required()
  }).or('email', 'username'),

  createCaregiver: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().optional().allow('', null),
    username: Joi.string().min(3).max(20).required(),
    password: Joi.string().min(6).optional(),
    temporaryPassword: Joi.string().min(6).optional(),
    phone: Joi.string().optional().allow('', null)
  }),

  bulkCreateCaregivers: Joi.object({
    caregivers: Joi.array().items(
      Joi.object({
        name: Joi.string().min(2).max(50).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(6).optional()
      })
    ).min(1).max(50).required()
  }),

  resetPassword: Joi.object({
    newPassword: Joi.string().min(6).required()
  })
};

// Resident validation schemas
const residentSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    room: Joi.string().min(1).max(20).required(),
    age: Joi.number().integer().min(1).max(150).required(),
    medicalConditions: Joi.array().items(Joi.string().max(100)).default([]),
    emergencyContact: Joi.object({
      name: Joi.string().max(100),
      phone: Joi.string().max(20),
      relationship: Joi.string().max(50)
    }).optional().allow(null),
    familyEmails: Joi.array().items(Joi.string().email()).default([]),
    notes: Joi.string().max(1000).optional().allow('', null)
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100).optional(),
    room: Joi.string().min(1).max(20).optional(),
    age: Joi.number().integer().min(1).max(150).optional(),
    medicalConditions: Joi.array().items(Joi.string().max(100)).optional(),
    emergencyContact: Joi.object({
      name: Joi.string().max(100).optional().allow(''),
      phone: Joi.string().max(20).optional().allow(''),
      relationship: Joi.string().max(50).optional().allow('')
    }).optional().allow(null),
    familyEmails: Joi.array().items(Joi.string().email()).optional(),
    notes: Joi.string().max(1000).optional().allow('', null)
  })
};

// Vitals validation schemas
const vitalsSchemas = {
  create: Joi.object({
    residentId: Joi.string().required(),
    systolicBP: Joi.number().integer().min(50).max(300).required(),
    diastolicBP: Joi.number().integer().min(30).max(200).required(),
    heartRate: Joi.number().integer().min(30).max(200).required(),
    temperature: Joi.number().min(90).max(110).optional(),
    notes: Joi.string().max(500).optional()
  })
};

// Incident validation schemas
const incidentSchemas = {
  create: Joi.object({
    residentId: Joi.string().required(),
    type: Joi.string().valid('fall', 'medical', 'emergency', 'other').required(),
    description: Joi.string().max(1000).required(),
    severity: Joi.string().valid('low', 'medium', 'high', 'critical').required()
  }),
  
  resolve: Joi.object({
    resolution: Joi.string().valid('true_emergency', 'false_alarm').required(),
    notes: Joi.string().max(1000).optional(),
    adminAction: Joi.string().max(500).optional()
  })
};

// Assignment validation schemas
const assignmentSchemas = {
  create: Joi.object({
    caregiverId: Joi.string().required(),
    residentId: Joi.string().required(),
    startDate: Joi.date().default(Date.now),
    endDate: Joi.date().optional(),
    shift: Joi.string().valid('morning', 'afternoon', 'evening', 'night', 'full_time').optional(),
    priority: Joi.string().valid('low', 'normal', 'high').optional(),
    specialInstructions: Joi.string().max(500).optional(),
    notes: Joi.string().max(1000).optional()
  })
};

// Report validation schemas
const reportSchemas = {
  generate: Joi.object({
    reportType: Joi.string().valid('vitals', 'incidents', 'assignments', 'comprehensive').required(),
    dateRange: Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().required()
    }).required(),
    residentIds: Joi.array().items(Joi.string()).optional(),
    caregiverIds: Joi.array().items(Joi.string()).optional(),
    includeVitals: Joi.boolean().default(true),
    includeIncidents: Joi.boolean().default(true),
    includeAssignments: Joi.boolean().default(true),
    format: Joi.string().valid('json', 'csv', 'pdf').default('json')
  }),
  
  schedule: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    reportConfig: Joi.object({
      reportType: Joi.string().valid('vitals', 'incidents', 'assignments', 'comprehensive').required(),
      residentIds: Joi.array().items(Joi.string()).optional(),
      caregiverIds: Joi.array().items(Joi.string()).optional(),
      includeVitals: Joi.boolean().default(true),
      includeIncidents: Joi.boolean().default(true),
      includeAssignments: Joi.boolean().default(true),
      format: Joi.string().valid('json', 'csv', 'pdf').default('json')
    }).required(),
    schedule: Joi.string().valid('daily', 'weekly', 'monthly').required(),
    recipients: Joi.array().items(Joi.string().email()).min(1).required(),
    isActive: Joi.boolean().default(true)
  })
};

module.exports = {
  validate,
  userSchemas,
  residentSchemas,
  vitalsSchemas,
  incidentSchemas,
  assignmentSchemas,
  reportSchemas
};