import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import io from 'socket.io-client';
import { ChatState } from './chatContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connectedUsers, setConnectedUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const { user } = ChatState();
  
  // Use refs to avoid re-creating socket connection
  const socketRef = useRef(null);
  const userRef = useRef(user);

  // Update user ref when user changes
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  useEffect(() => {
    // Only create socket if we don't have one and we have a token
    if (user?.token && !socketRef.current) {
      console.log('🔌 Creating new socket connection');
      
      // Initialize socket connection with authentication
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:3001', {
        auth: {
          token: user.token
        },
        transports: ['websocket', 'polling']
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('✅ Connected to Socket.io server');
        // Notify server that user is online
        newSocket.emit('user_online');
      });

      newSocket.on('disconnect', () => {
        console.log('❌ Disconnected from Socket.io server');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Message event handlers - using a more efficient approach
      newSocket.on('message_received', (data) => {
        console.log('📨 Message received via socket:', data);
        // This will be handled by the chat component
      });

      // Typing event handlers with optimized state updates
      newSocket.on('user_typing', (data) => {
        console.log('⌨️ User typing:', data);
        setTypingUsers(prev => {
          const current = prev[data.chatId] || {};
          if (current[data.userId] === data.userName) {
            return prev; // No change needed
          }
          return {
            ...prev,
            [data.chatId]: {
              ...current,
              [data.userId]: data.userName
            }
          };
        });
      });

      newSocket.on('user_stopped_typing', (data) => {
        console.log('⌨️ User stopped typing:', data);
        setTypingUsers(prev => {
          if (!prev[data.chatId] || !prev[data.chatId][data.userId]) {
            return prev; // No change needed
          }
          
          const newTyping = { ...prev };
          delete newTyping[data.chatId][data.userId];
          if (Object.keys(newTyping[data.chatId]).length === 0) {
            delete newTyping[data.chatId];
          }
          return newTyping;
        });
      });

      // User status event handlers with optimized updates
      newSocket.on('user_status', (data) => {
        console.log('👤 User status update:', data);
        setConnectedUsers(prev => {
          const isOnline = data.status === 'online';
          const isAlreadyOnline = prev.includes(data.userId);
          
          if (isOnline && !isAlreadyOnline) {
            return [...prev, data.userId];
          } else if (!isOnline && isAlreadyOnline) {
            return prev.filter(id => id !== data.userId);
          }
          return prev; // No change needed
        });
      });
    } else if (!user?.token && socketRef.current) {
      // Clean up socket when user logs out
      console.log('🔌 Closing socket connection');
      socketRef.current.close();
      socketRef.current = null;
      setSocket(null);
      setConnectedUsers([]);
      setTypingUsers({});
    }

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, [user?.token]); // Only depend on token, not the entire user object

  // Socket utility functions with useCallback to prevent re-renders
  const joinChat = useCallback((chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('join_chat', chatId);
    }
  }, []);

  const leaveChat = useCallback((chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('leave_chat', chatId);
    }
  }, []);

  const sendMessage = useCallback((messageData) => {
    if (socketRef.current) {
      socketRef.current.emit('new_message', messageData);
    }
  }, []);

  const startTyping = useCallback((chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_start', { chatId });
    }
  }, []);

  const stopTyping = useCallback((chatId) => {
    if (socketRef.current) {
      socketRef.current.emit('typing_stop', { chatId });
    }
  }, []);

  const isUserOnline = useCallback((userId) => {
    return connectedUsers.includes(userId);
  }, [connectedUsers]);

  const getTypingUsers = useCallback((chatId) => {
    return typingUsers[chatId] || {};
  }, [typingUsers]);

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    socket,
    connectedUsers,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    isUserOnline,
    getTypingUsers
  }), [
    socket,
    connectedUsers,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage,
    startTyping,
    stopTyping,
    isUserOnline,
    getTypingUsers
  ]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
