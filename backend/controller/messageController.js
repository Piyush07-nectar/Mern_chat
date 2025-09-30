const Message = require('../models/message');
const Chat = require('../models/chatmodel');
const User = require('../models/usermodel');

// Socket.io instance will be passed from server.js
let io;

const setSocketIOInstance = (socketIOInstance) => {
    io = socketIOInstance;
};

const sendMessage = async (req, res) => {
    try {
        const { content, chatId } = req.body;

        if (!content || !chatId) {
            return res.status(400).json({ message: "Content and chatId are required" });
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

        // Security Check 3: Validate message content (only for text messages)
        if (content.trim().length === 0) {
            return res.status(400).json({ message: "Message content cannot be empty" });
        }

        if (content.length > 1000) {
            return res.status(400).json({ message: "Message too long (max 1000 characters)" });
        }

        var newMessage = {
            sender: req.user._id,
            content: content.trim(),
            chat: chatId,
        };

        var message = await Message.create(newMessage);

        message = await message.populate("sender", "name pic");
        message = await message.populate("chat");
        message = await User.populate(message, {
            path: "chat.users",
            select: "name pic email",
        });

        await Chat.findByIdAndUpdate(chatId, { latestMessage: message });

        // Emit socket event for real-time messaging
        if (io) {
            // Emit to all users in the chat room
            io.to(chatId).emit('message_received', {
                message: message,
                chatId: chatId
            });
        }

        res.json(message);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

const getMessages = async (req, res) => {
    try {
        const chatId = req.params.chatId;

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

        // Only fetch messages if user is authorized
        const messages = await Message.find({ chat: chatId })
            .populate("sender", "name pic email")
            .populate("chat")
            .sort({ createdAt: 1 }); // Sort by creation time (oldest first)
        
        res.json(messages);
    } catch (error) {
        res.status(400);
        throw new Error(error.message);
    }
};

module.exports = { sendMessage, getMessages, setSocketIOInstance };
