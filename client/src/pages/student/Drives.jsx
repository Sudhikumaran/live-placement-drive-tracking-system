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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Placement Drives</h1>

                        {/* Filter Buttons */}
                        <div className="flex flex-wrap gap-3">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-indigo-50'
                                    }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('upcoming')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'upcoming' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-indigo-50'
                                    }`}
                            >
                                Upcoming
                            </button>
                            <button
                                onClick={() => setFilter('ongoing')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'ongoing' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-indigo-50'
                                    }`}
                            >
                                Ongoing
                            </button>
                            <button
                                onClick={() => setFilter('closed')}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${filter === 'closed' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-700 hover:bg-indigo-50'
                                    }`}
                            >
                                Closed
                            </button>
                        </div>
                    </div>

                    {filteredDrives.length === 0 ? (
                        <div className="card text-center py-12">
                            <p className="text-gray-500 text-lg">No drives available</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {filteredDrives.map((drive) => (
                                <div key={drive._id} className="card-gradient hover:scale-[1.02] transition-transform">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">{drive.companyName}</h3>
                                            <p className="text-lg text-gray-700 font-medium">{drive.role}</p>
                                        </div>
                                        <span className={`badge ${drive.status === 'upcoming' ? 'badge-info' :
                                                drive.status === 'ongoing' ? 'badge-warning' : 'badge-danger'
                                            } capitalize`}>
                                            {drive.status}
                                        </span>
                                    </div>

                                    <p className="text-gray-600 mb-4 line-clamp-2">{drive.description}</p>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500">CTC</p>
                                            <p className="font-semibold text-gray-900">{drive.ctc}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Location</p>
                                            <p className="font-semibold text-gray-900">{drive.location}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Min CGPA</p>
                                            <p className="font-semibold text-gray-900">{drive.eligibility.minCgpa}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Deadline</p>
                                            <p className="font-semibold text-gray-900">
                                                {new Date(drive.deadline).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <p className="text-sm text-gray-500 mb-2">Eligible Departments</p>
                                        <div className="flex flex-wrap gap-2">
                                            {drive.eligibility.departments.map((dept, idx) => (
                                                <span key={idx} className="badge badge-primary text-xs">
                                                    {dept}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {drive.rounds && drive.rounds.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-500 mb-2">Rounds</p>
                                            <div className="flex flex-wrap gap-2">
                                                {drive.rounds.map((round, idx) => (
                                                    <span key={idx} className="badge bg-gray-100 text-gray-700 text-xs">
                                                        {round.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => handleApply(drive._id)}
                                        disabled={drive.status === 'closed' || applying === drive._id}
                                        className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
