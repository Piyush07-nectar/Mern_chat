const User = require('../models/usermodel');
const generateToken = require('../connection/generateToken');
const bcrypt = require('bcryptjs');
const registerUser = async (req, res) => {
    try {
        console.log('=== REGISTRATION START (no email verification) ===');
        const { name, email, password, pic } = req.body;

        // Validate required fields
        if (!name || !email || !password) {
            res.status(400).json({
                message: 'Please provide all required fields: name, email, password'
            });
            return;
        }

        // Fast existence check
        const exists = await User.exists({ email });
        if (exists) {
            res.status(400).json({ message: 'User already exists' });
            return;
        }
        // Hash password and create user immediately
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            pic: pic || ''
        });

        console.log('✅ User created (email verification disabled):', email);
        const token = generateToken(user._id);
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            pic: user.pic || '',
            token,
            message: 'Registration successful'
        });
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({
            message: 'Internal server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
        });
    }
};

const verifyEmail = async (req, res) => {
    res.status(410).json({ message: 'Email verification is disabled.' });
};

const resendVerificationCode = async (req, res) => {
    res.status(410).json({ message: 'Email verification is disabled.' });
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
