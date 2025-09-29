const mongoose = require('mongoose');

const emailVerificationSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    verificationCode: {
        type: String,
        required: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
    },
    attempts: {
        type: Number,
        default: 0,
        max: 3 // Maximum 3 attempts
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for cleanup of expired records
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('EmailVerification', emailVerificationSchema);
