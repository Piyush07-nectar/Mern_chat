const nodemailer = require('nodemailer');

// Create transporter - you can configure this based on your email provider
const createTransporter = () => {
    // For Gmail
    if (process.env.EMAIL_SERVICE === 'gmail') {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS // Use App Password for Gmail
            }
        });
    }
    
    // For other SMTP providers
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

const sendVerificationEmail = async (email, verificationCode) => {
    try {
        // Check if email configuration is available
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ Email configuration not found. Using console output for testing.');
            console.log('📧 Verification Code for', email, ':', verificationCode);
            console.log('🔗 To enable real emails, set EMAIL_USER and EMAIL_PASS environment variables');
            return { success: true, messageId: 'console-test', testMode: true };
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'ChatApp - Email Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #007bff; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">ChatApp</h1>
                        <p style="margin: 10px 0 0 0; font-size: 16px;">Email Verification</p>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Welcome to ChatApp!</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Thank you for registering with ChatApp. To complete your registration, please use the verification code below:
                        </p>
                        
                        <div style="background-color: #fff; border: 2px dashed #007bff; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
                            <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px; font-family: 'Courier New', monospace;">
                                ${verificationCode}
                            </h1>
                        </div>
                        
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            <strong>Important:</strong>
                        </p>
                        <ul style="color: #666; font-size: 14px; line-height: 1.6;">
                            <li>This code will expire in <strong>15 minutes</strong></li>
                            <li>You have <strong>3 attempts</strong> to enter the correct code</li>
                            <li>If you didn't request this code, please ignore this email</li>
                        </ul>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                This is an automated message. Please do not reply to this email.
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Verification email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Error sending verification email:', error);
        
        // If email fails, fall back to console mode
        if (error.code === 'EAUTH' || error.message.includes('Username and Password not accepted')) {
            console.log('⚠️ Email authentication failed. Falling back to console mode.');
            console.log('📧 Verification Code for', email, ':', verificationCode);
            return { success: true, messageId: 'console-fallback', testMode: true };
        }
        
        return { success: false, error: error.message };
    }
};

const sendWelcomeEmail = async (email, name) => {
    try {
        // Check if email configuration is available
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('⚠️ Email configuration not found. Skipping welcome email.');
            console.log('🎉 Welcome', name, 'to ChatApp!');
            return { success: true, messageId: 'console-test', testMode: true };
        }

        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Welcome to ChatApp!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="margin: 0; font-size: 24px;">Welcome to ChatApp!</h1>
                    </div>
                    
                    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #333; margin-top: 0;">Hi ${name}!</h2>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Congratulations! Your email has been successfully verified and your ChatApp account is now active.
                        </p>
                        
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            You can now enjoy all the features of ChatApp:
                        </p>
                        
                        <ul style="color: #666; font-size: 14px; line-height: 1.6;">
                            <li>💬 Send and receive real-time messages</li>
                            <li>👥 Create group chats with friends</li>
                            <li>⌨️ See typing indicators</li>
                            <li>🟢 Check online status</li>
                            <li>🔍 Search for other users</li>
                        </ul>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/chat" 
                               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                                Start Chatting Now!
                            </a>
                        </div>
                        
                        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                            <p style="color: #999; font-size: 12px; margin: 0;">
                                Thank you for choosing ChatApp!
                            </p>
                        </div>
                    </div>
                </div>
            `
        };

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Welcome email sent successfully:', result.messageId);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('❌ Error sending welcome email:', error);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendVerificationEmail,
    sendWelcomeEmail
};
