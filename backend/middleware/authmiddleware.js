const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/usermodel');
const dotenv = require('dotenv');
const result = dotenv.config({ path: './.env' });
if (result.error) {
    console.log('❌ Error loading .env file:', result.error);
} else {
    console.log('✅ .env file loaded successfully');
}

const protect = asyncHandler(async (req, res, next) => {
    let token;
    if(req.headers.authorization && req.headers.authorization.startsWith('Bearer')){
        token = req.headers.authorization.split(' ')[1];
    }
    if(!token){
        res.status(401);
        throw new Error("Not authorized, token not found");
    }
    const decoded = verifyToken(token);
    req.user = await User.findById(decoded.id).select("-password");
    next();
});

const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
}

const decodeToken = (token) => {
    return jwt.decode(token);
}
module.exports = { protect, verifyToken, decodeToken };   