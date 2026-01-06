import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const StudentDrives = () => {
    const { user } = useAuth();
    const [drives, setDrives] = useState([]);
    const [filteredDrives, setFilteredDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [applying, setApplying] = useState(null);

    const filterOptions = [
        { key: 'all', label: 'All' },
        { key: 'upcoming', label: 'Upcoming' },
        { key: 'ongoing', label: 'Ongoing' },
        { key: 'closed', label: 'Closed' },
    ];

    const statusClasses = {
        upcoming: 'badge badge-primary',
        ongoing: 'badge badge-warning',
        closed: 'badge badge-error',
    };

    useEffect(() => {
        fetchDrives();
    }, []);

    useEffect(() => {
        filterDrives();
    }, [filter, drives]);

    const fetchDrives = async () => {
        try {
            const response = await api.get('/drives');
            setDrives(response.data.drives);
            setFilteredDrives(response.data.drives);
        } catch (error) {
            console.error('Error fetching drives:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterDrives = () => {
        if (filter === 'all') {
            setFilteredDrives(drives);
        } else {
            setFilteredDrives(drives.filter(d => d.status === filter));
        }
    };

    const handleApply = async (driveId) => {
        try {
            setApplying(driveId);
            await api.post('/applications/apply', { driveId });
            toast.success('Application submitted successfully!');
            fetchDrives();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to apply';
            toast.error(message);
        } finally {
            setApplying(null);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader size="large" text="Loading drives..." />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[var(--bg-secondary)] dark:bg-gray-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Placement Drives</h1>

                        <div className="flex flex-wrap gap-3">
                            {filterOptions.map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`btn ${filter === key ? 'btn-primary shadow-md' : 'btn-secondary'} text-sm`}
                                >
                                    {label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {filteredDrives.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-lg">No drives available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredDrives.map((drive) => (
                                <div
                                    key={drive._id}
                                    className="card p-6 space-y-5 hover:-translate-y-1 transition-all duration-200"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <h3 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                                {drive.companyName}
                                            </h3>
                                            <p className="text-lg text-gray-700 dark:text-gray-200 font-medium">
                                                {drive.role}
                                            </p>
                                            {drive.description && (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                                    {drive.description}
                                                </p>
                                            )}
                                        </div>
                                        <span
                                            className={`${statusClasses[drive.status] || 'badge bg-slate-100 text-gray-700 dark:bg-slate-700 dark:text-gray-100'} capitalize`}
                                        >
                                            {drive.status || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">CTC</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{drive.ctc}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Location</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{drive.location}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Min CGPA</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{drive.eligibility?.minCgpa ?? '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Deadline</p>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">
                                                {drive.deadline ? new Date(drive.deadline).toLocaleDateString() : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <p className="text-sm text-gray-500">Eligible Departments</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(drive.eligibility?.departments || []).map((dept, idx) => (
                                                <span key={idx} className="badge badge-primary text-xs">
                                                    {dept}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {drive.rounds && drive.rounds.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm text-gray-500">Rounds</p>
                                            <div className="flex flex-wrap gap-2">
                                                {drive.rounds.map((round, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="badge bg-slate-100 text-gray-700 dark:bg-slate-700 dark:text-gray-100 text-xs"
                                                    >
                                                        {round.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleApply(drive._id)}
                                        disabled={drive.status === 'closed' || applying === drive._id}
                                        className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {applying === drive._id ? 'Applying...' :
                                            drive.status === 'closed' ? 'Closed' : 'Apply Now'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default StudentDrives;
