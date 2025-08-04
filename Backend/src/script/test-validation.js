const Joi = require('joi');

// Test validation schema
const residentUpdateSchema = Joi.object({
  name: Joi.string().min(2).max(100),
  room: Joi.string().min(1).max(20),
  age: Joi.number().integer().min(1).max(150),
  medicalConditions: Joi.array().items(Joi.string().max(100)),
  emergencyContact: Joi.object({
    name: Joi.string().max(100),
    phone: Joi.string().max(20),
    relationship: Joi.string().max(50)
  }).optional().allow(null),
  familyEmails: Joi.array().items(Joi.string().email()),
  notes: Joi.string().max(1000).optional().allow('', null)
});

// Test data
const testData = {
  name: "John Doe",
  room: "101",
  age: 75,
  medicalConditions: ["Diabetes", "Hypertension"],
  emergencyContact: {
    name: "Jane Doe",
    phone: "123-456-7890",
    relationship: "Daughter"
  },
  familyEmails: ["family1@example.com", "family2@example.com"],
  notes: "Test notes"
};

console.log('🔍 Testing validation with data:', JSON.stringify(testData, null, 2));

const { error, value } = residentUpdateSchema.validate(testData);

if (error) {
  console.log('❌ Validation failed:', error.details.map(d => d.message).join(', '));
} else {
  console.log('✅ Validation passed');
  console.log('📧 Family emails validated:', value.familyEmails);
}

// Test with invalid email
const invalidData = {
  ...testData,
  familyEmails: ["invalid-email", "valid@email.com"]
};

console.log('\n🔍 Testing with invalid email...');
const { error: error2 } = residentUpdateSchema.validate(invalidData);

if (error2) {
  console.log('❌ Validation failed (expected):', error2.details.map(d => d.message).join(', '));
} else {
  console.log('✅ Validation passed (unexpected)');
}