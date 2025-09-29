# 💬 ChatApp - Real-time Chat Application

A modern, full-stack real-time chat application built with React, Node.js, Express, MongoDB, and Socket.io.

## ✨ Features

### 🔐 Authentication & User Management
- **User Registration & Login** with JWT authentication
- **Email Verification** system with secret codes
- **Profile Management** with avatar support
- **Secure password handling**

### 💬 Real-time Messaging
- **Real-time messaging** using Socket.io
- **One-on-one chats** and **Group chats**
- **Message status indicators** (sent, delivered)
- **Typing indicators** with debouncing
- **Message history** and persistence

### 🔔 Smart Notifications
- **Unread message tracking** with persistent counts
- **Real-time notification system** with red bell icon
- **Message count badges** on chat items
- **Smart notification logic** (only for new messages from others)

### 🌙 Modern UI/UX
- **Dark/Light theme toggle** with smooth transitions
- **Responsive design** for all screen sizes
- **Modern Bootstrap UI** with custom styling
- **Smooth animations** and transitions
- **Online/Offline status** indicators

### 👥 User Management
- **User search** and discovery
- **Add friends** functionality
- **Group chat creation** and management
- **Profile viewing** and interaction

## 🚀 Tech Stack

### Frontend
- **React.js** - UI framework
- **React Bootstrap** - UI components
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **React Router** - Navigation
- **React Bootstrap Icons** - Icons

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.io** - Real-time communication
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **Nodemailer** - Email service
- **bcryptjs** - Password hashing

## 📦 Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Gmail account (for email service)

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/chatapp
   JWT_SECRET=your_jwt_secret_key
   
   # Email Configuration (Optional)
   EMAIL_SERVICE=gmail
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd Frontend/frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

## 🔧 Configuration

### Email Setup (Optional)
For email verification to work, configure Gmail App Password:

1. Enable 2-Factor Authentication on Gmail
2. Generate App Password for "Mail"
3. Use the App Password in your `.env` file

See `EMAIL_SETUP.md` for detailed instructions.

## 🎯 Usage

1. **Register** a new account or **Login**
2. **Verify email** (if email is configured)
3. **Search and add friends**
4. **Start chatting** with real-time messaging
5. **Create group chats** for multiple users
6. **Toggle between light/dark themes**
7. **Receive notifications** for unread messages

## 📱 Features Overview

### Chat Interface
- **Sidebar** with chat list and user info
- **Main chat area** with message history
- **Message input** with typing indicators
- **Online status** indicators

### Notification System
- **Bell icon** turns red when new messages arrive
- **Unread count badges** on individual chats
- **Persistent notification counts** across sessions
- **Smart filtering** (only counts messages from others)

### Theme System
- **Light/Dark mode toggle**
- **Smooth transitions** between themes
- **Persistent theme preference**
- **Theme-aware components**

## 🔒 Security Features

- **JWT-based authentication**
- **Password hashing** with bcryptjs
- **Input validation** and sanitization
- **CORS protection**
- **Rate limiting** (can be added)

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Deploy to Heroku, Vercel, or similar platform

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy to Netlify, Vercel, or similar platform

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🎉 Acknowledgments

- Built with modern web technologies
- Inspired by popular chat applications
- Designed for scalability and user experience

---

**Happy Chatting! 💬✨**
