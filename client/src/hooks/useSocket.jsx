import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import toast from 'react-hot-toast';

const useSocket = () => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const socketInstance = getSocket();
        setSocket(socketInstance);

        if (socketInstance) {
            // Listen for notifications
            socketInstance.on('notification', (data) => {
                setNotifications((prev) => [...prev, data]);
                toast.success(data.message || 'New notification');
            });

            // Listen for shortlist updates
            socketInstance.on('shortlist_update', (data) => {
                toast.info(data.message || 'Shortlist updated');
                // Trigger a refetch of applications
                window.dispatchEvent(new Event('refetchApplications'));
            });

            // Listen for status updates
            socketInstance.on('status_update', (data) => {
                toast.info(data.message || 'Status updated');
                window.dispatchEvent(new Event('refetchApplications'));
            });

            // Listen for drive updates
            socketInstance.on('drive_update', (data) => {
                toast.info(data.message || 'Drive updated');
                window.dispatchEvent(new Event('refetchDrives'));
            });
        }

        return () => {
            if (socketInstance) {
                socketInstance.off('notification');
                socketInstance.off('shortlist_update');
                socketInstance.off('status_update');
                socketInstance.off('drive_update');
            }
        };
    }, []);

    const joinDrive = (driveId) => {
        if (socket) {
            socket.emit('join_drive', driveId);
        }
    };

    const leaveDrive = (driveId) => {
        if (socket) {
            socket.emit('leave_drive', driveId);
        }
    };

    const clearNotifications = () => {
        setNotifications([]);
    };

    return {
        socket,
        notifications,
        joinDrive,
        leaveDrive,
        clearNotifications,
    };
};

export default useSocket;
