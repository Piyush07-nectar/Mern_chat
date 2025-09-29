import React from 'react';
import { Button } from 'react-bootstrap';
import { Sun, Moon } from 'react-bootstrap-icons';
import { useTheme } from '../context/themeContext';

const ThemeToggle = ({ size = 'sm', className = '' }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <Button
      variant="outline-secondary"
      size={size}
      onClick={toggleTheme}
      className={`theme-toggle ${className}`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={{
        borderColor: 'var(--border-color)',
        color: 'var(--text-secondary)',
        backgroundColor: 'transparent'
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
    </Button>
  );
};

export default ThemeToggle;
