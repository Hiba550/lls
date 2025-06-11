import React from 'react';
import { useNotificationContext } from '../context/NotificationContext';
import Notification from './Notification';

const NotificationContainer = () => {
  const { notifications, deleteNotification } = useNotificationContext();

  // Group notifications by position
  const notificationsByPosition = notifications.reduce((acc, notification) => {
    const position = notification.position || 'top-right';
    if (!acc[position]) {
      acc[position] = [];
    }
    acc[position].push(notification);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(notificationsByPosition).map(([position, positionNotifications]) => (
        <div key={position} className={`fixed z-50 pointer-events-none ${getContainerPosition(position)}`}>
          <div className="flex flex-col gap-2 pointer-events-auto">
            {positionNotifications.map((notification) => (
              <Notification
                key={notification.id}
                id={notification.id}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                duration={notification.duration}
                position={position}
                showCloseButton={notification.showCloseButton !== false}
                onClose={deleteNotification}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );
};

const getContainerPosition = (position) => {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-center':
      return 'top-4 left-1/2 transform -translate-x-1/2';
    case 'top-right':
      return 'top-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-center':
      return 'bottom-4 left-1/2 transform -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-4 right-4';
    default:
      return 'top-4 right-4';
  }
};

export default NotificationContainer;
