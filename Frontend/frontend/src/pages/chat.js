import React, { useState, useEffect, useCallback } from 'react';
import {
  Button,
  Form,
  InputGroup,
  ListGroup,
  Badge,
  Modal,
  Alert,
  Spinner
} from 'react-bootstrap';
import {
  Search,
  Person,
  PersonFill,
  Send,
  PersonPlus
} from 'react-bootstrap-icons';
import axios from 'axios';
import { ChatState } from '../context/chatContext';
import { useSocket } from '../context/socketContext';
import { useTheme } from '../context/themeContext';
import { useNotification } from '../context/notificationContext';
import { useNavigate } from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle';
import NotificationIcon from '../components/NotificationIcon';

const API_BASE_URL = 'http://localhost:5000';

function Chat() {
  const navigate = useNavigate();
  const {
    user,
    chats,
    setChats,
    selectedChat,
    setSelectedChat,
    messages,
    setMessages,
    isLoading,
    setIsLoading
  } = ChatState();

  // Socket.io functionality
  const {
    socket,
    connectedUsers,
    typingUsers,
    joinChat,
    leaveChat,
    sendMessage: socketSendMessage,
    startTyping,
    stopTyping,
    isUserOnline,
    getTypingUsers
  } = useSocket();

  // Theme functionality
  const { isDark } = useTheme();

  // Notification functionality
  const { addUnreadMessage, getUnreadCount } = useNotification();

  // Note: Notification system now works with real-time socket messages

  // Local state
  const [search, setSearch] = useState('');
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupChatName, setGroupChatName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showAddFriendModal, setShowAddFriendModal] = useState(false);
  const [friendSearch, setFriendSearch] = useState('');
  const [friendSearchResult, setFriendSearchResult] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedUserProfile, setSelectedUserProfile] = useState(null);
  // Group modal specific search state
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResult, setGroupSearchResult] = useState([]);
  // Typing indicator state
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState(null);

  const getConfig = useCallback(() => {
    return {
      headers: {
        Authorization: `Bearer ${user?.token}`,
        'Content-Type': 'application/json',
      },
    };
  }, [user]);

  const fetchChats = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Debug: Check if user and token exist
      console.log('🔍 Debug - User:', user);
      console.log('🔍 Debug - Token:', user?.token);
      console.log('🔍 Debug - Config:', getConfig());
      
      const response = await axios.get(`${API_BASE_URL}/api/chat`, getConfig());
      setChats(response.data);
    } catch (error) {
      console.error('❌ Error fetching chats:', error);
      console.error('❌ Error response:', error.response?.data);
      setError('Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  }, [getConfig, setChats, setIsLoading, setError]);

  const fetchMessages = useCallback(async (chatId) => {
    try {
      setLoading(true);
      console.log('🔍 Fetching messages for chat:', chatId);
      const response = await axios.get(`${API_BASE_URL}/api/message/${chatId}`, getConfig());
      console.log('🔍 Messages fetched:', response.data);
      console.log('🔍 Number of messages:', response.data?.length);
      setMessages(response.data);
    } catch (error) {
      console.error('❌ Error fetching messages:', error);
      setError('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  }, [getConfig, setMessages, setError]);

  const searchUsers = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user?search=${query}`, getConfig());
      setSearchResult(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [getConfig, setSearchResult, setError]);

  const getAllUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user`, getConfig());
      // Filter out current user and users already in chats
      const filteredUsers = response.data.filter(
        (userItem) => 
          userItem._id !== user?._id && 
          !chats.some(chat => 
            !chat.isGroupChat && 
            chat.users.some(chatUser => chatUser._id === userItem._id)
          )
      );
      setFriendSearchResult(filteredUsers);
    } catch (error) {
      console.error('Error fetching all users:', error);
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [getConfig, setFriendSearchResult, setError, chats, user]);

  const searchFriends = useCallback(async (query) => {
    if (!query.trim()) {
      // If no query, show all users
      getAllUsers();
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user?search=${query}`, getConfig());
      // Filter out current user and users already in chats
      const filteredUsers = response.data.filter(
        (userItem) => 
          userItem._id !== user?._id && 
          !chats.some(chat => 
            !chat.isGroupChat && 
            chat.users.some(chatUser => chatUser._id === userItem._id)
          )
      );
      setFriendSearchResult(filteredUsers);
    } catch (error) {
      console.error('Error searching friends:', error);
      setError('Failed to search friends');
    } finally {
      setLoading(false);
    }
  }, [getConfig, setFriendSearchResult, setError, chats, user, getAllUsers]);

  const searchUsersForGroup = useCallback(async (query) => {
    if (!query.trim()) {
      setGroupSearchResult([]);
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/user?search=${query}`, getConfig());
      // Filter out current user and already selected users
      const filteredUsers = response.data.filter(
        (userItem) => 
          userItem._id !== user?._id && 
          !selectedUsers.some(selected => selected._id === userItem._id)
      );
      setGroupSearchResult(filteredUsers);
    } catch (error) {
      console.error('Error searching users for group:', error);
      setError('Failed to search users');
    } finally {
      setLoading(false);
    }
  }, [getConfig, setGroupSearchResult, setError, user, selectedUsers]);

  const accessChat = async (userId) => {
    try {
      setLoading(true);
      const response = await axios.post(`${API_BASE_URL}/api/chat`, { userId }, getConfig());
      
      if (!chats.find((c) => c._id === response.data._id)) {
        setChats([response.data, ...chats]);
      }
      setSelectedChat(response.data);
      setSearch('');
      setSearchResult([]);
      setFriendSearch('');
      setFriendSearchResult([]);
    } catch (error) {
      console.error('Error accessing chat:', error);
      setError('Failed to access chat');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = useCallback(async () => {
    if (!newMessage.trim() || !selectedChat?._id || loading) return;

    try {
      setLoading(true);
      
      // Stop typing indicator
      stopTyping(selectedChat._id);
      
      const response = await axios.post(
        `${API_BASE_URL}/api/message`,
        {
          content: newMessage,
          chatId: selectedChat._id,
        },
        getConfig()
      );
      
      console.log('🔍 Message sent - Response:', response.data);
      
      // Don't add message to local state here - let socket event handle it
      // This prevents duplicate messages when both HTTP response and socket event fire
      setNewMessage('');
      
      // Clear typing timeout
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
      }
      
      // Reset typing state
      setIsTyping(false);
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  }, [newMessage, selectedChat?._id, stopTyping, getConfig, typingTimeout]);

  const createGroupChat = async (e) => {
    e.preventDefault(); // Prevent form submission and page refresh
    
    if (!groupChatName.trim() || selectedUsers.length < 2) {
      setError('Please provide group name and select at least 2 users');
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        `${API_BASE_URL}/api/chat/group`,
        {
          name: groupChatName,
          users: JSON.stringify(selectedUsers.map(u => u._id)),
        },
        getConfig()
      );
      
      setChats([response.data, ...chats]);
      setSelectedChat(response.data);
      setShowGroupModal(false);
      setGroupChatName('');
      setSelectedUsers([]);
      setGroupSearch('');
      setGroupSearchResult([]);
      setSuccess('Group chat created successfully!');
    } catch (error) {
      console.error('Error creating group chat:', error);
      setError('Failed to create group chat');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearch(query);
    if (query.trim()) {
      searchUsers(query);
    } else {
      setSearchResult([]);
    }
  };

  const handleFriendSearch = (e) => {
    const query = e.target.value;
    setFriendSearch(query);
    if (query.trim()) {
      searchFriends(query);
    } else {
      setFriendSearchResult([]);
    }
  };

  const handleGroupSearch = (e) => {
    const query = e.target.value;
    setGroupSearch(query);
    if (query.trim()) {
      searchUsersForGroup(query);
    } else {
      setGroupSearchResult([]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle typing indicators with debouncing
  const handleTyping = useCallback((e) => {
    if (!selectedChat?._id) return;
    
    const value = e.target.value;
    setNewMessage(value);
    
    // Start typing indicator
    if (!isTyping) {
      setIsTyping(true);
      startTyping(selectedChat._id);
    }
    
    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }
    
    // Set new timeout to stop typing
    const timeout = setTimeout(() => {
      setIsTyping(false);
      stopTyping(selectedChat._id);
    }, 3000);
    
    setTypingTimeout(timeout);
  }, [selectedChat?._id, isTyping, startTyping, stopTyping, typingTimeout]);

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getSenderName = (message) => {
    if (!message?.sender || !user) return 'Unknown';
    return message.sender._id === user._id ? 'You' : message.sender.name;
  };

  const getChatName = (chat) => {
    if (!chat) return 'Unknown Chat';
    if (chat.isGroupChat) {
      return chat.chatName || 'Group Chat';
    }
    if (!user) return 'Unknown User';
    return chat.users?.find(u => u._id !== user._id)?.name || 'Unknown User';
  };

  // Helper function to filter out unwanted avatar URLs
  const getValidAvatar = (pic) => {
    if (!pic || pic.includes('icon-library.com') || pic.includes('anonymous') || pic.includes('placeholder')) {
      return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTUiIGN5PSIxNSIgcj0iMTUiIGZpbGw9IiNlMGUwZTAiLz4KPHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSI1IiB5PSI1Ij4KPHBhdGggZD0iTTEwIDEwQzEyLjc2MTQgMTAgMTUgNy43NjE0MiAxNSA1QzE1IDIuMjM4NTggMTIuNzYxNCAwIDEwIDBDNy4yMzg1OCAwIDUgMi4yMzg1OCA1IDVDNSA3Ljc2MTQyIDcuMjM4NTggMTAgMTAgMTBaIiBmaWxsPSIjOTk5Ii8+CjxwYXRoIGQ9Ik0xMCAxMkM2LjY4NjMgMTIgNCAxNC42ODYzIDQgMThIMTZDMTYgMTQuNjg2MyAxMy4zMTM3IDEyIDEwIDEyWiIgZmlsbD0iIzk5OSIvPgo8L3N2Zz4KPC9zdmc+';
    }
    return pic;
  };

  const getChatAvatar = (chat) => {
    if (!chat) return '👤';
    if (chat.isGroupChat) {
      return '👥';
    }
    if (!user) return '👤';
    const otherUser = chat.users?.find(u => u._id !== user._id);
    // For chat avatars, return emoji, not SVG data
    const pic = otherUser?.pic;
    if (!pic || pic.includes('icon-library.com') || pic.includes('anonymous') || pic.includes('placeholder')) {
      return '👤';
    }
    return '👤'; // Always return emoji for chat list
  };

  const handleProfileClick = (userProfile) => {
    console.log('🔍 handleProfileClick called with:', userProfile?.name);
    setSelectedUserProfile(userProfile);
    setShowProfileModal(true);
  };

  // Redirect if not logged in
  useEffect(() => {
    console.log('🔍 User check - User:', user);
    console.log('🔍 User check - User token:', user?.token);
    console.log('🔍 User check - LocalStorage:', localStorage.getItem('userInfo'));
    
    if (!user) {
      console.log('❌ No user found, redirecting to home');
      navigate('/');
    }
  }, [user, navigate]);

  // Fetch chats on component mount
  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user, fetchChats]);

  // Fetch messages when chat is selected
  useEffect(() => {
    if (selectedChat?._id) {
      console.log('🔍 Chat selected:', selectedChat._id);
      fetchMessages(selectedChat._id);
      
      // Join the chat room for real-time updates
      joinChat(selectedChat._id);
      
      // Cleanup: leave previous chat room
      return () => {
        leaveChat(selectedChat._id);
      };
    }
  }, [selectedChat?._id, fetchMessages, joinChat, leaveChat]); // Only depend on chat ID

  // Socket.io event handlers with optimized dependencies
  useEffect(() => {
    if (socket) {
      // Handle incoming messages
      const handleMessageReceived = (data) => {
        console.log('📨 Real-time message received:', data);
        console.log('📨 Current selected chat:', selectedChat?._id);
        console.log('📨 Message from user:', data.message.sender?._id);
        console.log('📨 Current user:', user?._id);
        
        // Check if this is a new message from another user
        const isFromOtherUser = data.message.sender?._id !== user?._id;
        const isNotCurrentChat = data.chatId !== selectedChat?._id;
        
        console.log('📨 Is from other user:', isFromOtherUser);
        console.log('📨 Is not current chat:', isNotCurrentChat);
        
        // Add to notification system ONLY if it's a new message from another user
        // and not in the currently viewed chat
        if (isFromOtherUser && isNotCurrentChat) {
          console.log('🔔 Adding to notification system');
          addUnreadMessage(data.chatId, data.message);
        }
        
        // Always add message to current chat if it's for the current chat
        if (data.chatId === selectedChat?._id) {
          setMessages(prev => {
            // Check if message already exists to prevent duplicates
            const messageExists = prev.some(msg => 
              msg._id === data.message._id || 
              (msg.content === data.message.content && 
               msg.sender?._id === data.message.sender?._id &&
               Math.abs(new Date(msg.createdAt) - new Date(data.message.createdAt)) < 1000)
            );
            if (messageExists) {
              console.log('🚫 Duplicate message detected, skipping');
              return prev;
            }
            console.log('✅ Adding new message to chat');
            return [...prev, data.message];
          });
        }
        
        // Update chats list to show latest message
        setChats(prev => prev.map(chat => 
          chat._id === data.chatId 
            ? { ...chat, latestMessage: data.message }
            : chat
        ));
      };

      socket.on('message_received', handleMessageReceived);

      // Cleanup socket listeners
      return () => {
        socket.off('message_received', handleMessageReceived);
      };
    }
  }, [socket, selectedChat?._id, addUnreadMessage]); // Include addUnreadMessage in dependencies

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [typingTimeout]);

  return (
    <div style={{ 
      height: '100vh', 
      display: 'flex',
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)'
    }}>
      {/* Sidebar */}
      <div style={{ 
        width: '300px', 
        borderRight: '1px solid var(--border-color)', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: 'var(--bg-primary)'
      }}>
        {/* Header */}
        <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Chats</h5>
            <div>
              <NotificationIcon className="me-2" />
              <ThemeToggle className="me-2" />
              <Button
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={() => setShowUserSearch(!showUserSearch)}
                title="Search Users"
              >
                <Search size={16} />
              </Button>
              <Button
                variant="outline-success"
                size="sm"
                className="me-2"
                onClick={() => setShowAddFriendModal(true)}
                title="Add Friend"
              >
                <PersonPlus size={16} />
              </Button>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setShowGroupModal(true)}
                title="Create Group"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Person size={14} />
                  <PersonFill size={14} />
                </div>
              </Button>
            </div>
          </div>

          {/* User Search */}
          {showUserSearch && (
            <div className="mb-3">
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search users..."
                  value={search}
                  onChange={handleSearch}
                />
              </InputGroup>
              
              {searchResult.length > 0 && (
                <ListGroup className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResult.map((userItem) => (
                    <ListGroup.Item
                      key={userItem._id}
                      action
                      className="d-flex align-items-center"
                    >
                      <img
                        src={getValidAvatar(userItem.pic)}
                        alt={userItem.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(userItem);
                        }}
                        style={{ 
                          width: '30px', 
                          height: '30px', 
                          borderRadius: '50%', 
                          marginRight: '10px',
                          cursor: 'pointer'
                        }}
                        title="Click to view profile"
                      />
                      <div 
                        style={{ flex: 1, cursor: 'pointer' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(userItem);
                        }}
                        title="Click to view profile"
                      >
                        <div className="fw-bold">{userItem.name}</div>
                        <small className="text-muted">{userItem.email}</small>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          accessChat(userItem._id);
                        }}
                        title="Click to start chat"
                      >
                        Chat
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </div>
          )}
        </div>

        {/* Chats List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {isLoading ? (
            <div className="text-center p-3">
              <Spinner animation="border" size="sm" />
            </div>
          ) : (
            <ListGroup variant="flush">
              {chats.map((chat) => {
                const unreadCount = getUnreadCount(chat._id);
                return (
                  <ListGroup.Item
                    key={chat._id}
                    active={selectedChat?._id === chat._id}
                    className="d-flex align-items-center p-3"
                    style={{ 
                      cursor: 'pointer',
                      border: 'none',
                      borderBottom: '1px solid var(--border-color)'
                    }}
                  onClick={(e) => {
                    // Check if the click is on the name area
                    if (e.target.closest('.profile-name')) {
                      return; // Let the profile name handler deal with it
                    }
                    
                    console.log('🔍 Chat item clicked:', chat.chatName || chat.users?.find(u => u._id !== user._id)?.name);
                    setSelectedChat(chat);
                  }}
                  title="Click to open chat"
                >
                  <div 
                    className="me-3" 
                    style={{ fontSize: '24px', minWidth: '32px' }}
                  >
                    {getChatAvatar(chat)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="d-flex align-items-center">
                      <div 
                        className="fw-bold text-truncate profile-name" 
                        style={{ 
                          flex: 1,
                          cursor: 'pointer',
                          padding: '2px 4px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => {
                          if (!chat.isGroupChat) {
                            e.target.style.backgroundColor = '#f8f9fa';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = 'transparent';
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('🔍 Profile name clicked for chat:', chat.chatName || chat.users?.find(u => u._id !== user._id)?.name);
                          if (!chat.isGroupChat) {
                            const otherUser = chat.users?.find(u => u._id !== user._id);
                            if (otherUser) {
                              console.log('🔍 Opening profile for user:', otherUser.name);
                              handleProfileClick(otherUser);
                            }
                          }
                        }}
                        title={!chat.isGroupChat ? "Click to view profile" : ""}
                      >
                        {getChatName(chat)}
                      </div>
                      {!chat.isGroupChat && (() => {
                        const otherUser = chat.users?.find(u => u._id !== user._id);
                        return otherUser && isUserOnline(otherUser._id) ? (
                          <div className="ms-2">
                            <div 
                              style={{ 
                                width: '8px', 
                                height: '8px', 
                                backgroundColor: '#28a745', 
                                borderRadius: '50%',
                                border: '1px solid white'
                              }} 
                              title="Online"
                            />
                          </div>
                        ) : null;
                      })()}
                    </div>
                    <small className="text-muted">
                      {chat.latestMessage ? (
                        <>
                          {chat.latestMessage.sender.name}: {chat.latestMessage.content}
                        </>
                      ) : (
                        'No messages yet'
                      )}
                    </small>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    {chat.isGroupChat && (
                      <Badge bg="secondary">
                        Group
                      </Badge>
                    )}
                    {unreadCount > 0 && (
                      <Badge 
                        bg="primary"
                        style={{
                          backgroundColor: 'var(--message-bg-sent)',
                          color: 'var(--message-text-sent)'
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                </ListGroup.Item>
                );
              })}
            </ListGroup>
          )}
        </div>

        {/* User Info */}
        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <div className="d-flex align-items-center">
            <img
              src={getValidAvatar(user?.pic)}
              alt={user?.name}
              style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }}
            />
            <div>
              <div className="fw-bold">{user?.name}</div>
              <small className="text-muted">{user?.email}</small>
            </div>
            <Button
              variant="outline-secondary"
              size="sm"
              className="ms-auto"
              onClick={() => {
                localStorage.removeItem('userInfo');
                navigate('/');
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
              <div className="d-flex align-items-center">
                <div 
                  className="me-3" 
                  style={{ fontSize: '24px', cursor: 'default' }}
                  title="Chat avatar"
                >
                  {getChatAvatar(selectedChat)}
                </div>
                <div 
                  style={{ cursor: !selectedChat.isGroupChat ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (!selectedChat.isGroupChat) {
                      const otherUser = selectedChat.users?.find(u => u._id !== user._id);
                      if (otherUser) {
                        handleProfileClick(otherUser);
                      }
                    }
                  }}
                  title={!selectedChat.isGroupChat ? "Click to view profile" : ""}
                >
                  <div className="d-flex align-items-center">
                    <h6 className="mb-0">{getChatName(selectedChat)}</h6>
                    {!selectedChat.isGroupChat && (() => {
                      const otherUser = selectedChat.users?.find(u => u._id !== user._id);
                      return otherUser && isUserOnline(otherUser._id) ? (
                        <div className="ms-2">
                          <div 
                            style={{ 
                              width: '8px', 
                              height: '8px', 
                              backgroundColor: '#28a745', 
                              borderRadius: '50%',
                              border: '1px solid white'
                            }} 
                            title="Online"
                          />
                        </div>
                      ) : null;
                    })()}
                  </div>
                  <small className="text-muted">
                    {selectedChat.isGroupChat 
                      ? `${selectedChat.users.length} members` 
                      : (() => {
                          const otherUser = selectedChat.users?.find(u => u._id !== user._id);
                          return otherUser && isUserOnline(otherUser._id) ? 'Online' : 'Offline';
                        })()
                    }
                  </small>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '1rem',
                background: 'var(--bg-secondary)'
              }}
            >
              {loading ? (
                <div className="text-center">
                  <Spinner animation="border" />
                </div>
              ) : (
                <div>
                  {console.log('🔍 Rendering messages:', messages)}
                  {messages.map((message) => (
                    <div
                      key={message._id}
                      className={`d-flex mb-3 ${
                        message?.sender?._id === user?._id ? 'justify-content-end' : 'justify-content-start'
                      }`}
                    >
                      <div
                        className={`p-3 rounded ${
                          message?.sender?._id === user?._id
                            ? 'bg-primary text-white'
                            : 'border'
                        }`}
                        style={{
                          backgroundColor: message?.sender?._id === user?._id 
                            ? 'var(--message-bg-sent)' 
                            : 'var(--message-bg-received)',
                          color: message?.sender?._id === user?._id 
                            ? 'var(--message-text-sent)' 
                            : 'var(--message-text-received)',
                          borderColor: 'var(--border-color)',
                          maxWidth: '70%'
                        }}
                      >
                        <div className="fw-bold small">
                          {getSenderName(message)}
                        </div>
                        <div>{message?.content || message?.message || 'Message content unavailable'}</div>
                        <div className="small opacity-75">
                          {message?.createdAt ? formatTime(message.createdAt) : 'Unknown time'}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {/* Typing Indicators */}
                  {selectedChat && (() => {
                    const typingUsers = getTypingUsers(selectedChat._id);
                    const typingUserNames = Object.values(typingUsers);
                    
                    if (typingUserNames.length > 0) {
                      return (
                        <div className="d-flex justify-content-start mb-3">
                          <div 
                            className="border rounded p-2"
                            style={{
                              backgroundColor: 'var(--typing-bg)',
                              borderColor: 'var(--border-color)'
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <Spinner animation="grow" size="sm" className="me-2" />
                              <small className="text-muted">
                                {typingUserNames.length === 1 
                                  ? `${typingUserNames[0]} is typing...`
                                  : `${typingUserNames.join(', ')} are typing...`
                                }
                              </small>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>

            {/* Message Input */}
            <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <InputGroup>
                <Form.Control
                  as="textarea"
                  rows={2}
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                />
                <Button
                  variant="primary"
                  onClick={sendMessage}
                  disabled={!newMessage.trim() || loading}
                >
                  <Send size={16} />
                </Button>
              </InputGroup>
            </div>
          </>
        ) : (
          <div className="d-flex align-items-center justify-content-center h-100">
            <div className="text-center">
              <h4>Welcome to ChatApp!</h4>
              <p className="text-muted">Select a chat to start messaging</p>
            </div>
          </div>
        )}
      </div>

      {/* Create Group Modal */}
      <Modal show={showGroupModal} onHide={() => {
        setShowGroupModal(false);
        setGroupSearch('');
        setGroupSearchResult([]);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Create Group Chat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={createGroupChat}>
            <Form.Group className="mb-3">
              <Form.Label>Group Name</Form.Label>
              <Form.Control
                type="text"
                placeholder="Enter group name"
                value={groupChatName}
                onChange={(e) => setGroupChatName(e.target.value)}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Add Users</Form.Label>
              <InputGroup>
                <Form.Control
                  type="text"
                  placeholder="Search users to add..."
                  value={groupSearch}
                  onChange={handleGroupSearch}
                />
              </InputGroup>
              
              {groupSearchResult.length > 0 && (
                <ListGroup className="mt-2" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                  {groupSearchResult.map((userItem) => (
                    <ListGroup.Item
                      key={userItem._id}
                      action
                      onClick={() => {
                        if (!selectedUsers.find(u => u._id === userItem._id)) {
                          setSelectedUsers([...selectedUsers, userItem]);
                        }
                        setGroupSearch('');
                        setGroupSearchResult([]);
                      }}
                      className="d-flex align-items-center"
                    >
                      <img
                        src={getValidAvatar(userItem.pic)}
                        alt={userItem.name}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                      />
                      <div>
                        <div className="fw-bold">{userItem.name}</div>
                        <small className="text-muted">{userItem.email}</small>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Form.Group>

            {selectedUsers.length > 0 && (
              <div>
                <Form.Label>Selected Users:</Form.Label>
                <div className="d-flex flex-wrap gap-2">
                  {selectedUsers.map((userItem) => (
                    <Badge key={userItem._id} bg="primary" className="d-flex align-items-center">
                      {userItem.name}
                      <Button
                        variant="link"
                        size="sm"
                        className="text-white p-0 ms-1"
                        onClick={() => setSelectedUsers(selectedUsers.filter(u => u._id !== userItem._id))}
                      >
                        ×
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowGroupModal(false);
            setGroupSearch('');
            setGroupSearchResult([]);
          }}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={createGroupChat}
            disabled={!groupChatName.trim() || selectedUsers.length < 2 || loading}
          >
            {loading ? <Spinner size="sm" /> : 'Create Group'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Add Friend Modal */}
      <Modal show={showAddFriendModal} onHide={() => {
        setShowAddFriendModal(false);
        setFriendSearch('');
        setFriendSearchResult([]);
      }}>
        <Modal.Header closeButton>
          <Modal.Title>Start Chat with Users</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Search Users or View All</Form.Label>
              <div className="d-flex gap-2 mb-2">
                <InputGroup style={{ flex: 1 }}>
                  <Form.Control
                    type="text"
                    placeholder="Search users by name or email..."
                    value={friendSearch}
                    onChange={handleFriendSearch}
                  />
                </InputGroup>
                <Button 
                  variant="outline-primary" 
                  onClick={getAllUsers}
                  disabled={loading}
                >
                  {loading ? <Spinner size="sm" /> : 'Show All Users'}
                </Button>
              </div>
              
              {friendSearchResult.length > 0 && (
                <ListGroup className="mt-2" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {friendSearchResult.map((friend) => (
                    <ListGroup.Item
                      key={friend._id}
                      action
                      onClick={() => {
                        accessChat(friend._id);
                        setShowAddFriendModal(false);
                        setFriendSearch('');
                        setFriendSearchResult([]);
                        setSuccess(`Started chat with ${friend.name}!`);
                      }}
                      className="d-flex align-items-center"
                    >
                      <img
                        src={getValidAvatar(friend.pic)}
                        alt={friend.name}
                        style={{ width: '30px', height: '30px', borderRadius: '50%', marginRight: '10px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div className="fw-bold">{friend.name}</div>
                        <small className="text-muted">{friend.email}</small>
                      </div>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          accessChat(friend._id);
                          setShowAddFriendModal(false);
                          setFriendSearch('');
                          setFriendSearchResult([]);
                          setSuccess(`Started chat with ${friend.name}!`);
                        }}
                      >
                        Start Chat
                      </Button>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
              
              {friendSearch && friendSearchResult.length === 0 && !loading && (
                <div className="text-center p-3 text-muted">
                  No users found. Try a different search term or click "Show All Users".
                </div>
              )}
              
              {!friendSearch && friendSearchResult.length === 0 && !loading && (
                <div className="text-center p-3 text-muted">
                  Click "Show All Users" to see all available users to chat with.
                </div>
              )}
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => {
            setShowAddFriendModal(false);
            setFriendSearch('');
            setFriendSearchResult([]);
          }}>
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Alerts */}
      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError('')}
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}
        >
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess('')}
          style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 9999 }}
        >
          {success}
        </Alert>
      )}

      {/* Profile Modal */}
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>User Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUserProfile && (
            <div className="text-center">
              <img
                src={getValidAvatar(selectedUserProfile.pic)}
                alt={selectedUserProfile.name}
                style={{ 
                  width: '100px', 
                  height: '100px', 
                  borderRadius: '50%', 
                  marginBottom: '20px',
                  objectFit: 'cover'
                }}
              />
              <h4 className="mb-3">{selectedUserProfile.name}</h4>
              
              <div className="row text-start">
                <div className="col-12 mb-3">
                  <div className="d-flex align-items-center">
                    <strong className="me-2">📧 Email:</strong>
                    <span>{selectedUserProfile.email}</span>
                  </div>
                </div>
                
                <div className="col-12 mb-3">
                  <div className="d-flex align-items-center">
                    <strong className="me-2">👤 Username:</strong>
                    <span>{selectedUserProfile.name}</span>
                  </div>
                </div>
                
                <div className="col-12 mb-3">
                  <div className="d-flex align-items-center">
                    <strong className="me-2">🆔 User ID:</strong>
                    <span className="text-muted small">{selectedUserProfile._id}</span>
                  </div>
                </div>
                
                {selectedUserProfile.pic && (
                  <div className="col-12 mb-3">
                    <div className="d-flex align-items-center">
                      <strong className="me-2">🖼️ Profile Picture:</strong>
                      <span className="text-muted small">Available</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowProfileModal(false)}>
            Close
          </Button>
          <Button 
            variant="primary" 
            onClick={() => {
              if (selectedUserProfile) {
                accessChat(selectedUserProfile._id);
                setShowProfileModal(false);
              }
            }}
          >
            Start Chat
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default Chat;