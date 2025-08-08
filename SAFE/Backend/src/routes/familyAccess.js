const express = require('express');
const nodemailer = require('nodemailer');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// Create nodemailer transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// POST /api/family/request-access
router.post('/request-access', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('residentName').trim().isLength({ min: 2, max: 100 }).withMessage('Resident name must be between 2-100 characters'),
  body('relationship').optional().trim().isLength({ max: 50 }).withMessage('Relationship must be less than 50 characters'),
  body('message').optional().trim().isLength({ max: 500 }).withMessage('Message must be less than 500 characters')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, residentName, relationship, message } = req.body;

    // Create email content
    const emailSubject = `Family Request Access - ${residentName}`;
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1565C0; color: white; padding: 20px; text-align: center;">
          <h1>SAFE Care System</h1>
          <h2>Family Request Access</h2>
        </div>
        
        <div style="padding: 20px; background-color: #f5f9ff;">
          <h3 style="color: #1565C0;">Request Details:</h3>
          
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <p><strong>Family Member Email:</strong> ${email}</p>
            <p><strong>Resident Name:</strong> ${residentName}</p>
            ${relationship ? `<p><strong>Relationship:</strong> ${relationship}</p>` : ''}
          </div>
          
          ${message ? `
          <div style="background-color: white; padding: 15px; border-radius: 8px; margin: 10px 0;">
            <h4 style="color: #1565C0; margin-top: 0;">Message from Family:</h4>
            <p style="color: #5F6368; line-height: 1.6; font-style: italic;">"${message}"</p>
          </div>
          ` : ''}
          
          <div style="background-color: #E3F2FD; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4 style="color: #1565C0; margin-top: 0;">Action Required:</h4>
            <p style="color: #5F6368; margin: 0;">
              Please review this family access request and contact the family member to verify their identity and relationship to the resident. 
              Once verified, you can grant them access to the resident's care information.
            </p>
          </div>
          
          <div style="text-align: center; margin: 20px 0;">
            <p style="color: #9AA0A6; font-size: 12px;">
              This request was submitted on ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      </div>
    `;

    // Check if email is configured
    if (!process.env.EMAIL_PASS || process.env.EMAIL_PASS === 'your_app_password_here') {
      // Log the request instead of sending email (for testing)
      console.log('📧 Family Access Request (Email not configured):');
      console.log(`From: ${email}`);
      console.log(`Resident: ${residentName}`);
      console.log(`Relationship: ${relationship || 'Not specified'}`);
      console.log(`Message: ${message || 'No message'}`);
      console.log('---');
    } else {
      // Send email to admin
      const transporter = createTransporter();

      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: emailSubject,
        html: emailBody
      };

      await transporter.sendMail(mailOptions);
    }

    // Log the request (optional - you might want to save to database)
    console.log(`Family access request: ${email} for resident ${residentName}`);

    res.json({
      success: true,
      message: 'Family access request submitted successfully. The facility administrator will review your request and contact you soon.'
    });

  } catch (error) {
    console.error('Error sending family access request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit family access request. Please try again later.'
    });
  }
});

module.exports = router;