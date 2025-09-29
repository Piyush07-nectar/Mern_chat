import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ChatContext = createContext();

const ChatProvider = ({children}) => {
    const [selectedChat, setSelectedChat] = useState();
    const navigate = useNavigate();
    const [user, setUser] = useState();
    const [chats, setChats] = useState([]);
    const [notification, setNotification] = useState([]);
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingChat, setIsLoadingChat] = useState(false);
    
    useEffect(() => {
        try {
            const userInfo = JSON.parse(localStorage.getItem('userInfo'));
            console.log('🔍 Context - Loading user from localStorage:', userInfo);
            setUser(userInfo);
            if(!userInfo){
                console.log('❌ Context - No user info found, redirecting to home');
                navigate('/');
            } else {
                console.log('✅ Context - User loaded successfully:', userInfo.name);
            }
        } catch (error) {
            console.error('❌ Context - Error parsing user info:', error);
            navigate('/');
        }
    }, [navigate]);
    return (
        <ChatContext.Provider value={{selectedChat, setSelectedChat, user, setUser, chats, setChats, notification, setNotification, messages, setMessages, isLoading, setIsLoading, isLoadingChat, setIsLoadingChat}}>
            {children}
        </ChatContext.Provider>
    );
}
const ChatState = () => {
 return useContext(ChatContext);        
}
export { ChatProvider, ChatState };