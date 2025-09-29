import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ChatState } from './chatContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user, selectedChat, messages } = ChatState();
  const [unreadCounts, setUnreadCounts] = useState({});
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  // Load unread counts from localStorage on mount
  useEffect(() => {
    if (user?._id) {
      const savedUnreadCounts = localStorage.getItem(`unreadCounts_${user._id}`);
      if (savedUnreadCounts) {
        const parsedCounts = JSON.parse(savedUnreadCounts);
        setUnreadCounts(parsedCounts);
        updateTotalUnreadCount(parsedCounts);
      }
    }
  }, [user?._id]);

  // Save unread counts to localStorage whenever they change
  useEffect(() => {
    if (user?._id && Object.keys(unreadCounts).length > 0) {
      localStorage.setItem(`unreadCounts_${user._id}`, JSON.stringify(unreadCounts));
    }
  }, [unreadCounts, user?._id]);

  // Update total unread count
  const updateTotalUnreadCount = useCallback((counts) => {
    const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
    console.log('🔔 updateTotalUnreadCount:', { counts, total });
    setTotalUnreadCount(total);
  }, []);

  // Mark all messages in a chat as read
  const markChatAsRead = useCallback((chatId) => {
    if (!user?._id || !chatId) return;

    setUnreadCounts(prev => {
      const newCounts = { ...prev };
      if (newCounts[chatId] > 0) {
        delete newCounts[chatId];
        const updatedCounts = { ...newCounts };
        updateTotalUnreadCount(updatedCounts);
        return updatedCounts;
      }
      return prev;
    });
  }, [user?._id, updateTotalUnreadCount]);

  // Add unread message to a chat (called from socket handler)
  const addUnreadMessage = useCallback((chatId, message) => {
    console.log('🔔 addUnreadMessage called:', { chatId, message: message?.content, sender: message?.sender?._id });
    
    if (!chatId || !message) {
      console.log('🔔 addUnreadMessage - early return: missing data');
      return;
    }

    console.log('🔔 addUnreadMessage - adding unread message');
    setUnreadCounts(prev => {
      const newCount = (prev[chatId] || 0) + 1;
      const newCounts = { ...prev, [chatId]: newCount };
      console.log('🔔 addUnreadMessage - new counts:', newCounts);
      updateTotalUnreadCount(newCounts);
      return newCounts;
    });
  }, [updateTotalUnreadCount]);

  // Get unread count for a specific chat
  const getUnreadCount = useCallback((chatId) => {
    return unreadCounts[chatId] || 0;
  }, [unreadCounts]);

  // Clear all unread counts (for logout)
  const clearAllUnreadCounts = useCallback(() => {
    setUnreadCounts({});
    setTotalUnreadCount(0);
    if (user?._id) {
      localStorage.removeItem(`unreadCounts_${user._id}`);
    }
  }, [user?._id]);

  // Mark chat as read when user selects it
  useEffect(() => {
    if (selectedChat?._id) {
      markChatAsRead(selectedChat._id);
    }
  }, [selectedChat?._id, markChatAsRead]);

  // Note: We'll handle unread message tracking in the socket event handler instead
  // This prevents duplicate counting when messages are fetched from API

  const value = {
    totalUnreadCount,
    unreadCounts,
    markChatAsRead,
    addUnreadMessage,
    getUnreadCount,
    clearAllUnreadCounts
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
