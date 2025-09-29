
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ChatProvider } from './context/chatContext';
import { SocketProvider } from './context/socketContext';
import { ThemeProvider } from './context/themeContext';
import { NotificationProvider } from './context/notificationContext';
import Home from './pages/home';
import Chat from './pages/chat';
import './styles/themes.css';

function App() {
  return (
    <ThemeProvider>
      <ChatProvider>
        <SocketProvider>
          <NotificationProvider>
            <Routes>
              <Route path='/' element={<Home />} />
              <Route path='chat' element={<Chat />} />
            </Routes>
          </NotificationProvider>
        </SocketProvider>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
