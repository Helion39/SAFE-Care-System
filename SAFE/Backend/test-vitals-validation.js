const Joi = require('joi');

// Test the vitals validation schema
const vitalsSchema = Joi.object({
  residentId: Joi.string().required(),
  systolicBP: Joi.number().integer().min(50).max(300).required(),
  diastolicBP: Joi.number().integer().min(30).max(200).required(),
  heartRate: Joi.number().integer().min(30).max(200).required(),
  temperature: Joi.number().min(30).max(45).optional(),
  oxygenSaturation: Joi.number().min(70).max(100).optional(),
  notes: Joi.string().max(500).optional()
});

// Test data similar to what frontend sends
const testData1 = {
  residentId: "507f1f77bcf86cd799439011",
  systolicBP: 120,
  diastolicBP: 80,
  heartRate: 72
};

const testData2 = {
  residentId: "507f1f77bcf86cd799439011",
  systolicBP: 120,
  diastolicBP: 80,
  heartRate: 72,
  temperature: 36.5
};

console.log('Testing vitals validation...');

console.log('\n1. Testing without temperature:');
const result1 = vitalsSchema.validate(testData1);
if (result1.error) {
  console.log('❌ Validation failed:', result1.error.details.map(d => d.message));
} else {
  console.log('✅ Validation passed');
}

console.log('\n2. Testing with temperature:');
const result2 = vitalsSchema.validate(testData2);
if (result2.error) {
  console.log('❌ Validation failed:', result2.error.details.map(d => d.message));
} else {
  console.log('✅ Validation passed');
}