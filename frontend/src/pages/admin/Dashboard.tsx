import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import adminService from '../../services/admin.service';
import type { PlacementDrive, OverallAnalytics, Student, Company } from '../../types';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import './Dashboard.css';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const AdminDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { socket, connected } = useSocket();

    const [analytics, setAnalytics] = useState<OverallAnalytics | null>(null);
    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'drives' | 'students' | 'companies'>('overview');
    const [exporting, setExporting] = useState(false);

    // Fetch initial data
    useEffect(() => {
        loadDashboardData();
    }, []);

    // Socket.IO event listeners
    useEffect(() => {
        if (!socket) return;

        // Listen for analytics updates
        socket.on('analytics:update', (payload: any) => {
            console.log('Received analytics update:', payload);

            // Update analytics data
            if (analytics) {
                setAnalytics((prev) => ({
                    ...prev!,
                    totalDrives: payload.totalDrives,
                    activeDrives: payload.activeDrives,
                    totalApplications: payload.totalApplications,
                    totalStudents: payload.totalStudents,
                    placedStudents: payload.placedStudents,
                    placementPercentage: payload.placementPercentage,
                    departmentStats: payload.departmentStats || prev!.departmentStats,
                    companyStats: payload.companyStats || prev!.companyStats,
                }));
            }
        });

        // Listen for drive created/updated
        socket.on('drive:created', () => {
            loadDrives();
            loadAnalytics();
        });

        socket.on('drive:updated', () => {
            loadDrives();
        });

        return () => {
            socket.off('analytics:update');
            socket.off('drive:created');
            socket.off('drive:updated');
        };
    }, [socket, analytics]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            await Promise.all([
                loadAnalytics(),
                loadDrives(),
                loadStudents(),
                loadCompanies(),
            ]);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadAnalytics = async () => {
        try {
            const response = await adminService.getOverallAnalytics();
            if (response.success && response.data) {
                setAnalytics(response.data);
            }
        } catch (error) {
            console.error('Error loading analytics:', error);
        }
    };

    const loadDrives = async () => {
        try {
            const response = await adminService.getAllDrives();
            if (response.success && response.data) {
                setDrives(response.data);
            }
        } catch (error) {
            console.error('Error loading drives:', error);
        }
    };

    const loadStudents = async () => {
        try {
            const response = await adminService.getAllStudents();
            if (response.success && response.data) {
                setStudents(response.data);
            }
        } catch (error) {
            console.error('Error loading students:', error);
        }
    };

    const loadCompanies = async () => {
        try {
            const response = await adminService.getAllCompanies();
            if (response.success && response.data) {
                setCompanies(response.data);
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        }
    };

    const handleUpdateDriveStatus = async (driveId: string, status: 'ACTIVE' | 'CLOSED' | 'COMPLETED') => {
        try {
            await adminService.updateDriveStatus(driveId, status);
            alert(`Drive status updated to ${status}`);
            await loadDrives();
            await loadAnalytics();
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update drive status');
        }
    };

    const handleExportPlacements = async () => {
        setExporting(true);
        try {
            await adminService.exportPlacements();
            alert('Placements data exported successfully!');
        } catch (error) {
            alert('Failed to export placements data');
        } finally {
            setExporting(false);
        }
    };

    const handleExportStudents = async () => {
        setExporting(true);
        try {
            await adminService.exportStudents();
            alert('Students data exported successfully!');
        } catch (error) {
            alert('Failed to export students data');
        } finally {
            setExporting(false);
        }
    };

    if (loading) {
        return <div className="loading">Loading admin dashboard...</div>;
    }

    return (
        <div className="dashboard">
            {/* Header */}
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>📊 Admin Dashboard</h1>
                    <div className="header-actions">
                        <div className="user-info">
                            <span>Welcome, {user?.name}</span>
                            <span className="socket-status" style={{ color: connected ? 'green' : 'red' }}>
                                {connected ? '● Live Updates Active' : '○ Offline'}
                            </span>
                        </div>
                        <button onClick={logout} className="btn btn-outline">
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            {/* Key Metrics */}
            <div className="stats-container">
                <div className="stat-card">
                    <h3>{analytics?.totalStudents || 0}</h3>
                    <p>Total Students</p>
                </div>
                <div className="stat-card">
                    <h3>{analytics?.placedStudents || 0}</h3>
                    <p>Placed Students</p>
                </div>
                <div className="stat-card">
                    <h3>{analytics?.placementPercentage.toFixed(1) || 0}%</h3>
                    <p>Placement Rate</p>
                </div>
                <div className="stat-card">
                    <h3>{analytics?.activeDrives || 0}</h3>
                    <p>Active Drives</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Analytics Overview
                </button>
                <button
                    className={`tab ${activeTab === 'drives' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drives')}
                >
                    Manage Drives ({drives.length})
                </button>
                <button
                    className={`tab ${activeTab === 'students' ? 'active' : ''}`}
                    onClick={() => setActiveTab('students')}
                >
                    Students ({students.length})
                </button>
                <button
                    className={`tab ${activeTab === 'companies' ? 'active' : ''}`}
                    onClick={() => setActiveTab('companies')}
                >
                    Companies ({companies.length})
                </button>
            </div>

            {/* Tab Content */}
            <div className="tab-content">
                {/* Analytics Overview Tab */}
                {activeTab === 'overview' && analytics && (
                    <div className="analytics-overview">
                        <div className="analytics-header">
                            <h2>Real-Time Analytics</h2>
                            <div className="export-buttons">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExportPlacements}
                                    disabled={exporting}
                                >
                                    📥 Export Placements
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleExportStudents}
                                    disabled={exporting}
                                >
                                    📥 Export Students
                                </button>
                            </div>
                        </div>

                        {/* Charts Grid */}
                        <div className="charts-grid">
                            {/* Department-wise Placement */}
                            <div className="chart-card">
                                <h3>Department-wise Placement Rate</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.departmentStats}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="department" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="placedStudents" fill="#10b981" name="Placed" />
                                        <Bar dataKey="totalStudents" fill="#3b82f6" name="Total" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Company Performance */}
                            <div className="chart-card">
                                <h3>Company Conversion Rates</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={analytics.companyStats.slice(0, 5)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="companyName" />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="conversionRate" fill="#8b5cf6" name="Conversion %" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Placement Status Distribution */}
                            <div className="chart-card">
                                <h3>Placement Status</h3>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={[
                                                { name: 'Placed', value: analytics.placedStudents },
                                                { name: 'Unplaced', value: analytics.totalStudents - analytics.placedStudents },
                                            ]}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            <Cell fill="#10b981" />
                                            <Cell fill="#ef4444" />
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Offer Statistics */}
                            <div className="chart-card">
                                <h3>Offer Statistics</h3>
                                <div className="stats-list">
                                    <div className="stat-item">
                                        <span className="stat-label">Total Offers:</span>
                                        <span className="stat-value">{analytics.totalOffers}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Accepted:</span>
                                        <span className="stat-value green">{analytics.offersAccepted}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Pending:</span>
                                        <span className="stat-value orange">{analytics.offersPending}</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Acceptance Rate:</span>
                                        <span className="stat-value">{analytics.acceptanceRate.toFixed(1)}%</span>
                                    </div>
                                    <div className="stat-item">
                                        <span className="stat-label">Multiple Offers:</span>
                                        <span className="stat-value purple">{analytics.multipleOfferStudents}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Drives Management Tab */}
                {activeTab === 'drives' && (
                    <div className="drives-management">
                        <h2>Manage Placement Drives</h2>
                        {drives.length === 0 ? (
                            <p className="empty-state">No drives created yet.</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Company</th>
                                            <th>Title</th>
                                            <th>Job Role</th>
                                            <th>CTC</th>
                                            <th>Applicants</th>
                                            <th>Selected</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drives.map((drive: any) => (
                                            <tr key={drive.id}>
                                                <td>{drive.company_name}</td>
                                                <td>{drive.title}</td>
                                                <td>{drive.job_role}</td>
                                                <td>₹{drive.ctc} LPA</td>
                                                <td>{drive.total_applicants || 0}</td>
                                                <td>{drive.selected || 0}</td>
                                                <td>
                                                    <span className={`badge badge-${drive.status.toLowerCase()}`}>
                                                        {drive.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <select
                                                        value={drive.status}
                                                        onChange={(e) => handleUpdateDriveStatus(drive.id, e.target.value as any)}
                                                        className="status-select"
                                                    >
                                                        <option value="ACTIVE">ACTIVE</option>
                                                        <option value="CLOSED">CLOSED</option>
                                                        <option value="COMPLETED">COMPLETED</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Students Tab */}
                {activeTab === 'students' && (
                    <div className="students-list">
                        <h2>All Students</h2>
                        {students.length === 0 ? (
                            <p className="empty-state">No students registered yet.</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Department</th>
                                            <th>CGPA</th>
                                            <th>Year</th>
                                            <th>Applications</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {students.map((student: any) => (
                                            <tr key={student.id}>
                                                <td>{student.roll_number}</td>
                                                <td>{student.full_name}</td>
                                                <td>{student.department}</td>
                                                <td>{student.cgpa}</td>
                                                <td>{student.graduation_year}</td>
                                                <td>{student.application_count || 0}</td>
                                                <td>
                                                    {student.placement_status > 0 ? (
                                                        <span className="badge badge-success">Placed</span>
                                                    ) : (
                                                        <span className="badge badge-warning">Unplaced</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Companies Tab */}
                {activeTab === 'companies' && (
                    <div className="companies-list">
                        <h2>All Companies</h2>
                        {companies.length === 0 ? (
                            <p className="empty-state">No companies registered yet.</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Company Name</th>
                                            <th>Industry</th>
                                            <th>HR Contact</th>
                                            <th>Drives</th>
                                            <th>Total Applicants</th>
                                            <th>Offers</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {companies.map((company: any) => (
                                            <tr key={company.id}>
                                                <td>{company.company_name}</td>
                                                <td>{company.industry || 'N/A'}</td>
                                                <td>{company.hr_contact_name || 'N/A'}</td>
                                                <td>{company.drives_created || 0}</td>
                                                <td>{company.total_applicants || 0}</td>
                                                <td>{company.offers_made || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
