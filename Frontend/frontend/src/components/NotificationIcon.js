import React, { useState } from 'react';
import { Button, Badge, OverlayTrigger, Popover } from 'react-bootstrap';
import { Bell, BellFill } from 'react-bootstrap-icons';
import { useNotification } from '../context/notificationContext';
import { useTheme } from '../context/themeContext';

const NotificationIcon = ({ className = '' }) => {
  const { totalUnreadCount, unreadCounts, markChatAsRead } = useNotification();
  const { isDark } = useTheme();
  const [showPopover, setShowPopover] = useState(false);

  // Debug logging (can be removed in production)
  if (totalUnreadCount > 0) {
    console.log('🔔 NotificationIcon - totalUnreadCount:', totalUnreadCount);
  }

  const handleNotificationClick = (chatId) => {
    markChatAsRead(chatId);
    setShowPopover(false);
    // You can add navigation logic here if needed
  };

  const popover = (
    <Popover 
      id="notification-popover"
      style={{
        backgroundColor: 'var(--modal-bg)',
        borderColor: 'var(--border-color)',
        color: 'var(--text-primary)'
      }}
    >
      <Popover.Header 
        as="h6"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          borderBottomColor: 'var(--border-color)',
          color: 'var(--text-primary)'
        }}
      >
        Unread Messages
      </Popover.Header>
      <Popover.Body style={{ padding: '0' }}>
        {Object.keys(unreadCounts).length === 0 ? (
          <div 
            className="p-3 text-center"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Bell size={24} className="mb-2 opacity-50" />
            <div>No unread messages</div>
          </div>
        ) : (
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            {Object.entries(unreadCounts).map(([chatId, count]) => (
              <div
                key={chatId}
                className="p-3 border-bottom"
                style={{
                  borderBottomColor: 'var(--border-color)',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-primary)'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'var(--hover-bg)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'var(--bg-primary)';
                }}
                onClick={() => handleNotificationClick(chatId)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div 
                      className="fw-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Chat {chatId.slice(-6)}
                    </div>
                    <small style={{ color: 'var(--text-secondary)' }}>
                      {count} unread message{count > 1 ? 's' : ''}
                    </small>
                  </div>
                  <Badge 
                    bg="primary" 
                    style={{
                      backgroundColor: 'var(--message-bg-sent)',
                      color: 'var(--message-text-sent)'
                    }}
                  >
                    {count}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Popover.Body>
    </Popover>
  );

  return (
    <OverlayTrigger
      trigger="click"
      placement="bottom-end"
      show={showPopover}
      onToggle={setShowPopover}
      overlay={popover}
      rootClose
    >
      <Button
        variant={totalUnreadCount > 0 ? "danger" : "outline-secondary"}
        size="sm"
        className={`notification-icon ${className}`}
        title={`${totalUnreadCount} unread message${totalUnreadCount !== 1 ? 's' : ''}`}
        style={{
          borderColor: totalUnreadCount > 0 ? '#dc3545' : 'var(--border-color)',
          color: totalUnreadCount > 0 ? '#ffffff' : 'var(--text-secondary)',
          backgroundColor: totalUnreadCount > 0 ? '#dc3545' : 'transparent',
          position: 'relative',
          transition: 'all 0.3s ease',
          animation: totalUnreadCount > 0 ? 'pulse 0.5s ease-in-out' : 'none'
        }}
      >
        {totalUnreadCount > 0 ? (
          <BellFill size={16} style={{ color: '#ffffff' }} />
        ) : (
          <Bell size={16} style={{ color: 'var(--text-secondary)' }} />
        )}
        
        {totalUnreadCount > 0 && (
          <Badge
            bg="danger"
            style={{
              position: 'absolute',
              top: '-8px',
              right: '-8px',
              fontSize: '10px',
              minWidth: '18px',
              height: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%'
            }}
          >
            {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
          </Badge>
        )}
      </Button>
    </OverlayTrigger>
  );
};

export default NotificationIcon;
