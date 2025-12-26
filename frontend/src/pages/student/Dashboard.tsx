import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import studentService from '../../services/student.service';
import type { Application, Notification, PlacementDrive } from '../../types';
import './Dashboard.css';

const StudentDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { socket, connected } = useSocket();

    const [applications, setApplications] = useState<Application[]>([]);
    const [eligibleDrives, setEligibleDrives] = useState<PlacementDrive[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'applications' | 'drives' | 'notifications'>('applications');

    // Fetch initial data
    useEffect(() => {
        loadDashboardData();
    }, []);

    // Socket.IO event listeners
    useEffect(() => {
        if (!socket) return;

        // Listen for shortlist updates
        socket.on('shortlist:update', (payload: any) => {
            console.log('Received shortlist update:', payload);

            // Update applications list
            setApplications((prev) =>
                prev.map((app) =>
                    app.id === payload.applicationId
                        ? { ...app, overall_status: payload.overallStatus, current_round: payload.roundNumber }
                        : app
                )
            );

            // Show toast notification (you can add a toast library)
            alert(`${payload.driveName} - ${payload.roundName}: ${payload.status}`);
        });

        // Listen for new notifications
        socket.on('notification:new', (payload: any) => {
            console.log('New notification:', payload);
            setNotifications((prev) => [payload, ...prev]);
            setUnreadCount((prev) => prev + 1);
        });

        // Listen for drive created
        socket.on('drive:created', (payload: any) => {
            console.log('New drive created:', payload);
            loadEligibleDrives(); // Reload eligible drives
        });

        // Listen for offer created
        socket.on('offer:created', (payload: any) => {
            console.log('Offer received:', payload);
            alert(`🎉 Congratulations! You received an offer from ${payload.companyName}`);
            loadApplications(); // Reload to show offer
        });

        return () => {
            socket.off('shortlist:update');
            socket.off('notification:new');
            socket.off('drive:created');
            socket.off('offer:created');
        };
    }, [socket]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadApplications(),
                loadEligibleDrives(),
                loadNotifications(),
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadApplications = async () => {
        try {
            const response = await studentService.getMyApplications();
            if (response.success && response.data) {
                setApplications(response.data);
            }
        } catch (error) {
            console.error('Error loading applications:', error);
        }
    };

    const loadEligibleDrives = async () => {
        try {
            const response = await studentService.getEligibleDrives();
            if (response.success && response.data) {
                setEligibleDrives(response.data);
            }
        } catch (error) {
            console.error('Error loading drives:', error);
        }
    };

    const loadNotifications = async () => {
        try {
            const response = await studentService.getNotifications();
            if (response.success && response.data) {
                setNotifications(response.data);
                setUnreadCount(response.data.filter((n: Notification) => !n.is_read).length);
            }
        } catch (error) {
            console.error('Error loading notifications:', error);
        }
    };

    const handleApply = async (driveId: string) => {
        try {
            const response = await studentService.applyToDrive(driveId);
            if (response.success) {
                alert('Application submitted successfully!');
                await loadApplications();
                await loadEligibleDrives();
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to apply to drive');
        }
    };

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            await studentService.markNotificationRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPLIED':
                return 'blue';
            case 'IN_PROGRESS':
                return 'orange';
            case 'SELECTED':
                return 'green';
            case 'REJECTED':
                return 'red';
            case 'OFFER_ACCEPTED':
                return 'purple';
            default:
                return 'gray';
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>🎓 Student Dashboard</h1>
                    <div className="header-actions">
                        <div className="user-info">
                            <span>Welcome, {user?.name}</span>
                            <span className="socket-status" style={{ color: connected ? 'green' : 'red' }}>
                                {connected ? '● Connected' : '○ Offline'}
                            </span>
                        </div>
                        <button onClick={logout} className="btn btn-outline">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Stats Cards */}
            <div className="stats-container">
                <div className="stat-card">
                    <h3>{applications.length}</h3>
                    <p>Total Applications</p>
                </div>
                <div className="stat-card">
                    <h3>{applications.filter((a) => a.overall_status === 'IN_PROGRESS').length}</h3>
                    <p>In Progress</p>
                </div>
                <div className="stat-card">
                    <h3>{applications.filter((a) => a.overall_status === 'SELECTED').length}</h3>
                    <p>Selected</p>
                </div>
                <div className="stat-card">
                    <h3>{unreadCount}</h3>
                    <p>Unread Notifications</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'applications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applications')}
                >
                    My Applications ({applications.length})
                </button>
                <button
                    className={`tab ${activeTab === 'drives' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drives')}
                >
                    Available Drives ({eligibleDrives.length})
                </button>
                <button
                    className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
                    onClick={() => setActiveTab('notifications')}
                >
                    Notifications ({unreadCount})
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Applications Tab */}
                {activeTab === 'applications' && (
                    <div className="applications-list">
                        <h2>My Applications</h2>
                        {applications.length === 0 ? (
                            <p className="empty-state">No applications yet. Browse available drives to apply!</p>
                        ) : (
                            <div className="applications-grid">
                                {applications.map((app) => (
                                    <div key={app.id} className="application-card">
                                        <div className="card-header">
                                            <h3>{app.title || app.job_role}</h3>
                                            <span
                                                className="status-badge"
                                                style={{ backgroundColor: getStatusColor(app.overall_status) }}
                                            >
                                                {app.overall_status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className="card-body">
                                            <p><strong>Company:</strong> {app.company_name}</p>
                                            <p><strong>CTC:</strong> ₹{app.ctc} LPA</p>
                                            <p><strong>Current Round:</strong> {app.current_round} / {app.total_rounds}</p>
                                            <p><strong>Applied:</strong> {new Date(app.applied_at).toLocaleDateString()}</p>

                                            {app.rounds && app.rounds.length > 0 && (
                                                <div className="rounds-timeline">
                                                    <h4>Round History:</h4>
                                                    {app.rounds.map((round, idx) => (
                                                        <div key={idx} className="round-item">
                                                            <span className="round-number">R{round.round_number}</span>
                                                            <span className="round-name">{round.round_name || `Round ${round.round_number}`}</span>
                                                            <span className={`round-status ${round.status.toLowerCase()}`}>
                                                                {round.status}
                                                            </span>
                                                            {round.feedback && <p className="feedback">{round.feedback}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Available Drives Tab */}
                {activeTab === 'drives' && (
                    <div className="drives-list">
                        <h2>Available Drives</h2>
                        {eligibleDrives.length === 0 ? (
                            <p className="empty-state">No drives available at the moment.</p>
                        ) : (
                            <div className="drives-grid">
                                {eligibleDrives.map((drive) => (
                                    <div key={drive.id} className="drive-card">
                                        <div className="card-header">
                                            <h3>{drive.company_name}</h3>
                                            <span className="ctc">₹{drive.ctc} LPA</span>
                                        </div>
                                        <div className="card-body">
                                            <h4>{drive.title}</h4>
                                            <p><strong>Role:</strong> {drive.job_role}</p>
                                            <p><strong>Location:</strong> {drive.location || 'Not specified'}</p>
                                            <p><strong>Departments:</strong> {drive.eligible_departments.join(', ')}</p>
                                            <p><strong>Min CGPA:</strong> {drive.min_cgpa}</p>
                                            <p><strong>Rounds:</strong> {drive.total_rounds}</p>
                                            {drive.drive_date && (
                                                <p><strong>Date:</strong> {new Date(drive.drive_date).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                        <div className="card-footer">
                                            {drive.already_applied ? (
                                                <button className="btn btn-disabled" disabled>
                                                    Already Applied
                                                </button>
                                            ) : (
                                                <button
                                                    className="btn btn-primary"
                                                    onClick={() => handleApply(drive.id)}
                                                >
                                                    Apply Now
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <div className="notifications-list">
                        <h2>Notifications</h2>
                        {notifications.length === 0 ? (
                            <p className="empty-state">No notifications yet.</p>
                        ) : (
                            <div className="notifications-container">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={`notification-item ${notif.is_read ? 'read' : 'unread'}`}
                                        onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
                                    >
                                        <div className="notif-header">
                                            <h4>{notif.title}</h4>
                                            <span className="notif-time">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                        <p>{notif.message}</p>
                                        {!notif.is_read && <span className="unread-badge">New</span>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default StudentDashboard;
