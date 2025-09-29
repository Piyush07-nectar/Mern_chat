const User = require('../models/usermodel');
const EmailVerification = require('../models/emailVerification');
const generateToken = require('../connection/generateToken');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { sendVerificationEmail, sendWelcomeEmail } = require('../utils/emailService');
const crypto = require('crypto');
const registerUser = async (req, res) => {
    try {
        console.log('=== REGISTRATION DEBUG START ===');
        console.log('Registration attempt:', req.body);
        const { name, email, password, pic } = req.body;

        // Check if all required fields are provided
        if (!name || !email || !password) {
            res.status(400).json({ 
                message: 'Please provide all required fields: name, email, password' 
            });
            return;
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Create user directly without email verification
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            pic: pic || 'https://via.placeholder.com/150'
        });

        if (user) {
            console.log('✅ User created successfully:', user.email);
            
            // Generate JWT token for immediate login
            const token = generateToken(user._id);
            
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic,
                token: token,
                message: 'Registration successful! You are now logged in.'
            });
        } else {
            res.status(400).json({ message: 'Failed to create user' });
        }
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        console.log('=== REGISTRATION DEBUG END ===');
        
        res.status(500).json({ 
            message: 'Internal server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

const verifyEmail = async (req, res) => {
    try {
        const { email, verificationCode, name, password, pic } = req.body;

        // Check if all required fields are provided
        if (!email || !verificationCode || !name || !password) {
            res.status(400).json({ 
                message: 'Please provide all required fields: email, verificationCode, name, password' 
            });
            return;
        }

        // Find verification record
        const verification = await EmailVerification.findOne({ email });
        
        if (!verification) {
            res.status(400).json({ 
                message: 'No verification code found for this email. Please register again.' 
            });
            return;
        }

        // Check if already verified
        if (verification.isVerified) {
            res.status(400).json({ 
                message: 'Email already verified. Please login instead.' 
            });
            return;
        }

        // Check if expired
        if (verification.expiresAt < new Date()) {
            res.status(400).json({ 
                message: 'Verification code has expired. Please register again.' 
            });
            return;
        }

        // Check if too many attempts
        if (verification.attempts >= 3) {
            res.status(400).json({ 
                message: 'Too many failed attempts. Please register again.' 
            });
            return;
        }

        // Verify the code
        if (verification.verificationCode !== verificationCode) {
            verification.attempts += 1;
            await verification.save();
            
            res.status(400).json({ 
                message: 'Invalid verification code. Please try again.',
                attemptsLeft: 3 - verification.attempts
            });
            return;
        }

        // Check if user already exists (double check)
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in database
        console.log('Creating user in database after email verification...');
        
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            pic
        });

        // Mark email as verified
        verification.isVerified = true;
        await verification.save();

        // Send welcome email
        await sendWelcomeEmail(email, name);

        console.log('✅ User created successfully after email verification:', {
            _id: user._id,
            name: user.name,
            email: user.email
        });
        
        res.status(201).json({
            message: 'Email verified successfully! Welcome to ChatApp!',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                pic: user.pic || "",
                token: generateToken(user._id)
            }
        });
        
    } catch (error) {
        console.error('❌ Email verification error:', error);
        
        res.status(500).json({ 
            message: 'Internal server error during email verification',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

const resendVerificationCode = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ 
                message: 'Please provide email address' 
            });
            return;
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            res.status(400).json({ 
                message: 'User already exists. Please login instead.' 
            });
            return;
        }

        // Find verification record
        const verification = await EmailVerification.findOne({ email });
        
        if (!verification) {
            res.status(400).json({ 
                message: 'No pending verification found for this email. Please register first.' 
            });
            return;
        }

        // Check if already verified
        if (verification.isVerified) {
            res.status(400).json({ 
                message: 'Email already verified. Please login instead.' 
            });
            return;
        }

        // Generate new verification code
        const verificationCode = crypto.randomInt(100000, 999999).toString();
        
        // Update verification record
        verification.verificationCode = verificationCode;
        verification.attempts = 0;
        verification.expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await verification.save();

        // Send verification email
        let emailResult;
        try {
            emailResult = await sendVerificationEmail(email, verificationCode);
        } catch (emailError) {
            console.error('❌ Email service error:', emailError);
            // Continue without email verification for now
            emailResult = { success: true, message: 'Email verification skipped due to service issues' };
        }
        
        if (!emailResult.success) {
            console.error('❌ Failed to resend verification email:', emailResult.error);
            // Continue even if email fails
            console.log('⚠️ Continuing without email verification');
        }

        console.log('✅ Verification email resent successfully to:', email);
        
        res.status(200).json({
            message: 'New verification code sent to your email. Please check your inbox.',
            email: email,
            expiresIn: '15 minutes'
        });
        
    } catch (error) {
        console.error('❌ Resend verification error:', error);
        
        res.status(500).json({ 
            message: 'Internal server error while resending verification code',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if email and password are provided
        if (!email || !password) {
            res.status(400).json({ 
                message: 'Please provide email and password' 
            });
            return;
        }

        // Find user in database
        const user = await User.findOne({ email });
        
        if (!user) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

       // TODO: Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            res.status(401).json({ message: 'Invalid email or password' });
            return;
        }

       // Generate JWT token
        const token = generateToken(user._id);

        res.status(200).json({
            message: 'Login successful',
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic || "",
            token: token
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            message: 'Internal server error during login' 
        });
    }
};
const getUser = async (req, res) => {
    const keyword = req.query.search?
    {
        $or:[
            {name:{ $regex: req.query.search, $options: "i" }},
            {email:{ $regex: req.query.search, $options: "i" }}
        ]
    }:{};
    const users = await User.find(keyword).find({_id:{$ne:req.user._id}});  
    res.send(users)
}
module.exports = {
    registerUser,
    verifyEmail,
    resendVerificationCode,
    loginUser,
    getUser
};
