const cloudinary = require('../connection/cloudinary').cloudinary;
const Message = require('../models/message');
const Chat = require('../models/chatmodel');
const User = require('../models/usermodel');

// Socket.io instance will be passed from server.js
let io;

const setSocketIOInstance = (socketIOInstance) => {
    io = socketIOInstance;
};

const uploadImage = async (req, res) => {
    try {
        const { chatId } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No image file provided" });
        }

        if (!chatId) {
            return res.status(400).json({ message: "Chat ID is required" });
        }

        // Security Check 1: Verify the chat exists
        const chat = await Chat.findById(chatId);
        if (!chat) {
            return res.status(404).json({ message: "Chat not found" });
        }

        // Security Check 2: Verify the user is part of this chat
        const isUserInChat = chat.users.some(userId => userId.toString() === req.user._id.toString());
        if (!isUserInChat) {
            return res.status(403).json({ 
                message: "Access denied: You are not a member of this chat" 
            });
        }

        // Upload image to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'chatapp-images',
            resource_type: 'auto',
            transformation: [
                { width: 800, height: 600, crop: 'limit' },
                { quality: 'auto' }
            ]
        });

        // Create message with image
        const newMessage = {
            sender: req.user._id,
            content: '', // Empty content for image messages
            chat: chatId,
            messageType: 'image',
            imageUrl: result.secure_url,
            imagePublicId: result.public_id
        };

        const message = await Message.create(newMessage);

        // Populate the message with sender and chat details
        const populatedMessage = await message.populate("sender", "name pic");
        const finalMessage = await populatedMessage.populate("chat");
        const messageWithUsers = await User.populate(finalMessage, {
            path: "chat.users",
            select: "name pic email",
        });

        // Update chat with latest message
        await Chat.findByIdAndUpdate(chatId, { latestMessage: finalMessage });

        // Emit socket event for real-time messaging
        if (io) {
            io.to(chatId).emit('message_received', {
                message: messageWithUsers,
                chatId: chatId
            });
        }

        res.json({
            success: true,
            message: messageWithUsers
        });

    } catch (error) {
        console.error('Image upload error:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to upload image",
            error: error.message 
        });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { messageId } = req.params;

        // Find the message
        const message = await Message.findById(messageId);
        if (!message) {
            return res.status(404).json({ message: "Message not found" });
        }

        // Security Check: Verify the user is the sender or part of the chat
        const chat = await Chat.findById(message.chat);
        const isUserInChat = chat.users.some(userId => userId.toString() === req.user._id.toString());
        const isUserSender = message.sender.toString() === req.user._id.toString();

        if (!isUserInChat) {
            return res.status(403).json({ 
                message: "Access denied: You are not a member of this chat" 
            });
        }

        // Delete image from Cloudinary if it exists
        if (message.imagePublicId) {
            await cloudinary.uploader.destroy(message.imagePublicId);
        }

        // Delete the message from database
        await Message.findByIdAndDelete(messageId);

        res.json({ success: true, message: "Image message deleted successfully" });

    } catch (error) {
        console.error('Image deletion error:', error);
        res.status(500).json({ 
            success: false,
            message: "Failed to delete image",
            error: error.message 
        });
    }
};

module.exports = { uploadImage, deleteImage, setSocketIOInstance };
