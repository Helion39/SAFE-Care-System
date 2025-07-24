const Joi = require('joi');
const logger = require('../utils/logger');

// Generic validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      logger.warn('Validation error:', errorMessage);
      
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: errorMessage
      });
    }
    
    next();
  };
};

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'caregiver').required()
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
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
    }).optional()
  }),
  
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    room: Joi.string().min(1).max(20),
    age: Joi.number().integer().min(1).max(150),
    medicalConditions: Joi.array().items(Joi.string().max(100)),
    emergencyContact: Joi.object({
      name: Joi.string().max(100),
      phone: Joi.string().max(20),
      relationship: Joi.string().max(50)
    }).optional()
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
    endDate: Joi.date().optional()
  })
};

module.exports = {
  validate,
  userSchemas,
  residentSchemas,
  vitalsSchemas,
  incidentSchemas,
  assignmentSchemas
};