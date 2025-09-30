const express = require('express');
const cors = require('cors');
const app = express();
const { chats } = require('./data/data');
const dotenv = require('dotenv'); 
const connectDB = require('./connection/db');
const userRoutes = require('./Routes/userRoutes');
const chatRoutes = require('./Routes/chatRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const imageRoutes = require('./Routes/imageRoutes');
const { setSocketIOInstance } = require('./controller/messageController');
const { setSocketIOInstance: setImageSocketIOInstance } = require('./controller/imageController');
const { createServer } = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/usermodel');
const path = require('path');
// Load environment variables
dotenv.config({ path: './.env' });

// Debug: Check if environment variables are loaded 
app.use(cors({
    origin: [
        "http://localhost:3000", 
        "http://localhost:3001",
        "https://mern-chat-frontend-395i.onrender.com", // Your actual frontend URL
        "https://mern-chat-frontend.onrender.com",
        "https://mern-chat-frontend-4vo1.onrender.com"
    ],
    credentials: true
}));

if(process.env.NODE_ENV === 'production'){
    // Since backend is deployed separately, serve API info instead of frontend
    app.get('/', (req, res) => {
        res.json({
            message: 'ChatApp Backend API is running',
            status: 'success',
            endpoints: {
                users: '/api/user',
                chats: '/api/chat', 
                messages: '/api/message'
            }
        });
    });
}
else{
    app.get('/', (req, res) => {
        res.send('Api is Running through server 5000');
    });
}
app.use(express.json());
connectDB();

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/image', imageRoutes);

// Create HTTP server
const httpServer = createServer(app);

// Initialize Socket.io
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000", 
            "http://localhost:3001",
            "https://mern-chat-frontend-395i.onrender.com", // Your actual frontend URL
            "https://mern-chat-frontend.onrender.com",
            "https://mern-chat-frontend-4vo1.onrender.com"
        ],
        credentials: true
    }
});

// Pass socket.io instance to message controller
setSocketIOInstance(io);
setImageSocketIOInstance(io);

// Socket.io authentication middleware
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) {
            return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user._id.toString();
        socket.user = user;
        next();
    } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication error: Invalid token'));
    }
});

// Socket.io connection handling
io.on('connection', (socket) => {
    // Join user to their own room for personal notifications
    socket.join(socket.userId);

    // Handle joining chat rooms
    socket.on('join_chat', (chatId) => {
        socket.join(chatId);
    });

    // Handle leaving chat rooms
    socket.on('leave_chat', (chatId) => {
        socket.leave(chatId);
    });

    // Handle new messages
    socket.on('new_message', (data) => {
        // Broadcast message to all users in the chat
        socket.to(data.chatId).emit('message_received', data);
    });

    // Handle typing indicators
    socket.on('typing_start', (data) => {
        socket.to(data.chatId).emit('user_typing', {
            userId: socket.userId,
            userName: socket.user.name,
            chatId: data.chatId
        });
    });

    socket.on('typing_stop', (data) => {
        socket.to(data.chatId).emit('user_stopped_typing', {
            userId: socket.userId,
            userName: socket.user.name,
            chatId: data.chatId
        });
    });

    // Handle online status
    socket.on('user_online', () => {
        socket.broadcast.emit('user_status', {
            userId: socket.userId,
            status: 'online'
        });
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        // Broadcast offline status
        socket.broadcast.emit('user_status', {
            userId: socket.userId,
            status: 'offline'
        });
    });
});

const PORT = process.env.PORT || 3001; // Use port 3001 to avoid ad blocker issues
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});