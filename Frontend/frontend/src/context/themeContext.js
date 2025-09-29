import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Get theme from localStorage or default to 'light'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('chatApp-theme');
    return savedTheme || 'light';
  });

  // Save theme to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('chatApp-theme', theme);
    
    // Apply theme class to document body for global styling
    document.body.className = theme === 'dark' ? 'dark-theme' : 'light-theme';
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
