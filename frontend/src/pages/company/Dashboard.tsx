import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import companyService from '../../services/company.service';
import type { PlacementDrive, Applicant } from '../../types';
import './Dashboard.css';

const CompanyDashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const { socket, connected } = useSocket();

    const [drives, setDrives] = useState<PlacementDrive[]>([]);
    const [selectedDrive, setSelectedDrive] = useState<PlacementDrive | null>(null);
    const [applicants, setApplicants] = useState<Applicant[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'drives' | 'applicants' | 'create'>('drives');
    const [showShortlistModal, setShowShortlistModal] = useState(false);
    const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

    const [newDriveForm, setNewDriveForm] = useState({
        title: '',
        description: '',
        jobRole: '',
        ctc: '',
        location: '',
        eligibleDepartments: [] as string[],
        minCgpa: '',
        totalRounds: '3',
        driveDate: '',
    });

    const [shortlistForm, setShortlistForm] = useState({
        roundNumber: 1,
        roundName: '',
        status: 'SELECTED' as 'SELECTED' | 'REJECTED',
        feedback: '',
    });

    const departments = ['Computer Science', 'Electrical', 'Mechanical', 'Civil', 'Electronics'];

    useEffect(() => {
        loadDrives();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on('application:submitted', (payload: any) => {
            console.log('New application received:', payload);

            if (selectedDrive && payload.driveId === selectedDrive.id) {
                loadApplicants(selectedDrive.id);
            }
            loadDrives();
        });

        return () => {
            socket.off('application:submitted');
        };
    }, [socket, selectedDrive]);

    const loadDrives = async () => {
        setLoading(true);
        try {
            const response = await companyService.getMyDrives();
            if (response.success && response.data) {
                setDrives(response.data);
            }
        } catch (error) {
            console.error('Error loading drives:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadApplicants = async (driveId: string) => {
        try {
            const response = await companyService.getApplicants(driveId);
            if (response.success && response.data) {
                setApplicants(response.data);
            }
        } catch (error) {
            console.error('Error loading applicants:', error);
        }
    };

    const handleViewApplicants = async (drive: PlacementDrive) => {
        setSelectedDrive(drive);
        await loadApplicants(drive.id);
        setActiveTab('applicants');
    };

    const handleDepartmentToggle = (dept: string) => {
        setNewDriveForm((prev) => ({
            ...prev,
            eligibleDepartments: prev.eligibleDepartments.includes(dept)
                ? prev.eligibleDepartments.filter((d) => d !== dept)
                : [...prev.eligibleDepartments, dept],
        }));
    };

    const handleCreateDrive = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await companyService.createDrive({
                ...newDriveForm,
                ctc: parseFloat(newDriveForm.ctc),
                minCgpa: parseFloat(newDriveForm.minCgpa),
                totalRounds: parseInt(newDriveForm.totalRounds),
            });

            if (response.success) {
                alert('Drive created successfully!');
                setNewDriveForm({
                    title: '',
                    description: '',
                    jobRole: '',
                    ctc: '',
                    location: '',
                    eligibleDepartments: [],
                    minCgpa: '',
                    totalRounds: '3',
                    driveDate: '',
                });
                await loadDrives();
                setActiveTab('drives');
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create drive');
        }
    };

    const handleOpenShortlist = (applicant: Applicant) => {
        setSelectedApplicant(applicant);
        setShortlistForm({
            roundNumber: (applicant.current_round || 0) + 1,
            roundName: '',
            status: 'SELECTED',
            feedback: '',
        });
        setShowShortlistModal(true);
    };

    const handleShortlist = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedApplicant) return;

        try {
            const response = await companyService.updateShortlist({
                applicationId: selectedApplicant.id,
                ...shortlistForm,
            });

            if (response.success) {
                alert('Shortlist updated successfully!');
                setShowShortlistModal(false);
                if (selectedDrive) {
                    await loadApplicants(selectedDrive.id);
                }
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to update shortlist');
        }
    };

    const handleCreateOffer = async (applicant: Applicant) => {
        const ctc = prompt('Enter CTC (in LPA):');
        if (!ctc) return;

        try {
            const response = await companyService.createOffer({
                applicationId: applicant.id,
                ctc: parseFloat(ctc),
            });

            if (response.success) {
                alert('Offer created and sent to student!');
            }
        } catch (error: any) {
            alert(error.response?.data?.error || 'Failed to create offer');
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
            default:
                return 'gray';
        }
    };

    if (loading) {
        return <div className="loading">Loading dashboard...</div>;
    }

    return (
        <div className="dashboard">
            <header className="dashboard-header">
                <div className="header-content">
                    <h1>🏢 Company Dashboard</h1>
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

            <div className="stats-container">
                <div className="stat-card">
                    <h3>{drives.length}</h3>
                    <p>Total Drives</p>
                </div>
                <div className="stat-card">
                    <h3>{drives.filter((d: any) => d.status === 'ACTIVE').length}</h3>
                    <p>Active Drives</p>
                </div>
                <div className="stat-card">
                    <h3>{drives.reduce((sum: number, d: any) => sum + (d.total_applicants || 0), 0)}</h3>
                    <p>Total Applicants</p>
                </div>
                <div className="stat-card">
                    <h3>{drives.reduce((sum: number, d: any) => sum + (d.selected || 0), 0)}</h3>
                    <p>Selected</p>
                </div>
            </div>

            <div className="tabs">
                <button
                    className={`tab ${activeTab === 'drives' ? 'active' : ''}`}
                    onClick={() => setActiveTab('drives')}
                >
                    My Drives ({drives.length})
                </button>
                <button
                    className={`tab ${activeTab === 'applicants' ? 'active' : ''}`}
                    onClick={() => setActiveTab('applicants')}
                    disabled={!selectedDrive}
                >
                    Applicants {selectedDrive ? `(${applicants.length})` : ''}
                </button>
                <button
                    className={`tab ${activeTab === 'create' ? 'active' : ''}`}
                    onClick={() => setActiveTab('create')}
                >
                    Create New Drive
                </button>
            </div>

            <div className="tab-content">
                {activeTab === 'drives' && (
                    <div className="drives-list">
                        <h2>My Placement Drives</h2>
                        {drives.length === 0 ? (
                            <p className="empty-state">No drives created yet. Create your first drive!</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Title</th>
                                            <th>Job Role</th>
                                            <th>CTC</th>
                                            <th>Applicants</th>
                                            <th>In Progress</th>
                                            <th>Selected</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drives.map((drive: any) => (
                                            <tr key={drive.id}>
                                                <td>{drive.title}</td>
                                                <td>{drive.job_role}</td>
                                                <td>₹{drive.ctc} LPA</td>
                                                <td>{drive.total_applicants || 0}</td>
                                                <td>{drive.in_progress || 0}</td>
                                                <td>{drive.selected || 0}</td>
                                                <td>
                                                    <span className={`badge badge-${drive.status.toLowerCase()}`}>
                                                        {drive.status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button
                                                        className="btn btn-primary btn-sm"
                                                        onClick={() => handleViewApplicants(drive)}
                                                    >
                                                        View Applicants
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'applicants' && selectedDrive && (
                    <div className="applicants-section">
                        <div className="section-header">
                            <h2>Applicants for {selectedDrive.title}</h2>
                            <button className="btn btn-outline" onClick={() => setActiveTab('drives')}>
                                ← Back to Drives
                            </button>
                        </div>

                        {applicants.length === 0 ? (
                            <p className="empty-state">No applicants yet.</p>
                        ) : (
                            <div className="table-container">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Roll No</th>
                                            <th>Name</th>
                                            <th>Department</th>
                                            <th>CGPA</th>
                                            <th>Current Round</th>
                                            <th>Status</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {applicants.map((applicant) => (
                                            <tr key={applicant.id}>
                                                <td>{applicant.roll_number}</td>
                                                <td>{applicant.full_name}</td>
                                                <td>{applicant.department}</td>
                                                <td>{applicant.cgpa}</td>
                                                <td>
                                                    {applicant.current_round || 0} / {selectedDrive.total_rounds}
                                                </td>
                                                <td>
                                                    <span
                                                        className="badge"
                                                        style={{ backgroundColor: getStatusColor(applicant.overall_status) }}
                                                    >
                                                        {applicant.overall_status}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div className="action-buttons">
                                                        {applicant.overall_status !== 'REJECTED' &&
                                                            applicant.overall_status !== 'SELECTED' && (
                                                                <button
                                                                    className="btn btn-primary btn-sm"
                                                                    onClick={() => handleOpenShortlist(applicant)}
                                                                >
                                                                    Shortlist
                                                                </button>
                                                            )}
                                                        {applicant.overall_status === 'SELECTED' && (
                                                            <button
                                                                className="btn btn-success btn-sm"
                                                                onClick={() => handleCreateOffer(applicant)}
                                                            >
                                                                Create Offer
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'create' && (
                    <div className="create-drive-section">
                        <h2>Create New Placement Drive</h2>
                        <form onSubmit={handleCreateDrive} className="drive-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Drive Title *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newDriveForm.title}
                                        onChange={(e) => setNewDriveForm({ ...newDriveForm, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Job Role *</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newDriveForm.jobRole}
                                        onChange={(e) => setNewDriveForm({ ...newDriveForm, jobRole: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Description</label>
                                <textarea
                                    className="form-control"
                                    value={newDriveForm.description}
                                    onChange={(e) => setNewDriveForm({ ...newDriveForm, description: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>CTC (in LPA) *</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        className="form-control"
                                        value={newDriveForm.ctc}
                                        onChange={(e) => setNewDriveForm({ ...newDriveForm, ctc: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Location</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={newDriveForm.location}
                                        onChange={(e) => setNewDriveForm({ ...newDriveForm, location: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Minimum CGPA *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        max="10"
                                        className="form-control"
                                        value={newDriveForm.minCgpa}
                                        onChange={(e) => setNewDriveForm({ ...newDriveForm, minCgpa: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Total Rounds *</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="form-control"
                                        value={newDriveForm.totalRounds}
                                        onChange={(e) => setNewDriveForm({ ...newDriveForm, totalRounds: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Drive Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={newDriveForm.driveDate}
                                        onChange={(e) => setNewDriveForm({ ...newDriveForm, driveDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Eligible Departments *</label>
                                <div className="checkbox-group">
                                    {departments.map((dept) => (
                                        <label key={dept} className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={newDriveForm.eligibleDepartments.includes(dept)}
                                                onChange={() => handleDepartmentToggle(dept)}
                                            />
                                            {dept}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg">
                                Create Drive
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Shortlist Modal */}
            {showShortlistModal && selectedApplicant && (
                <div className="modal-overlay" onClick={() => setShowShortlistModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3>Shortlist: {selectedApplicant.full_name}</h3>
                        <form onSubmit={handleShortlist}>
                            <div className="form-group">
                                <label>Round Number</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    value={shortlistForm.roundNumber}
                                    onChange={(e) =>
                                        setShortlistForm({ ...shortlistForm, roundNumber: parseInt(e.target.value) })
                                    }
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Round Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={shortlistForm.roundName}
                                    onChange={(e) => setShortlistForm({ ...shortlistForm, roundName: e.target.value })}
                                    placeholder="e.g., Technical Interview"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    className="form-control"
                                    value={shortlistForm.status}
                                    onChange={(e) =>
                                        setShortlistForm({ ...shortlistForm, status: e.target.value as any })
                                    }
                                >
                                    <option value="SELECTED">SELECTED</option>
                                    <option value="REJECTED">REJECTED</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Feedback (optional)</label>
                                <textarea
                                    className="form-control"
                                    value={shortlistForm.feedback}
                                    onChange={(e) => setShortlistForm({ ...shortlistForm, feedback: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-outline" onClick={() => setShowShortlistModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Update Shortlist
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDashboard;
