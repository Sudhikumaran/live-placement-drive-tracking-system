import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import useSocket from '../../hooks/useSocket';
import api from '../../services/api';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const StudentDashboard = () => {
    const { user } = useAuth();
    const { notifications } = useSocket();
    const [stats, setStats] = useState({ applied: 0, shortlisted: 0, offers: 0 });
    const [upcomingDrives, setUpcomingDrives] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch applications
            const appsResponse = await api.get('/applications/my-applications');
            const applications = appsResponse.data.applications;

            // Calculate stats
            const applied = applications.length;
            const shortlisted = applications.filter(app =>
                app.roundStatus.some(r => r.status === 'shortlisted')
            ).length;
            const offers = applications.filter(app => app.finalStatus === 'selected').length;

            setStats({ applied, shortlisted, offers });

            // Fetch upcoming drives
            const drivesResponse = await api.get('/drives?status=upcoming');
            setUpcomingDrives(drivesResponse.data.drives.slice(0, 5));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader size="large" text="Loading dashboard..." />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8 animate-fade-in">
                        <h1 className="text-4xl font-bold text-gray-900 mb-2">
                            Welcome back, {user?.name}! 👋
                        </h1>
                        <p className="text-gray-600">
                            {user?.department} • CGPA: {user?.cgpa}
                        </p>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-slide-up">
                        <div className="card-gradient">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Applications</p>
                                    <p className="text-3xl font-bold text-indigo-600">{stats.applied}</p>
                                </div>
                                <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center">
                                    <svg className="w-7 h-7 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="card-gradient">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Shortlisted</p>
                                    <p className="text-3xl font-bold text-blue-600">{stats.shortlisted}</p>
                                </div>
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                                    <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        <div className="card-gradient">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">Offers</p>
                                    <p className="text-3xl font-bold text-green-600">{stats.offers}</p>
                                </div>
                                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
                                    <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Drives */}
                    <div className="card animate-slide-up">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">Upcoming Drives</h2>
                            <Link to="/student/drives" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                                View All →
                            </Link>
                        </div>

                        {upcomingDrives.length === 0 ? (
                            <p className="text-gray-500 text-center py-8">No upcoming drives available</p>
                        ) : (
                            <div className="space-y-4">
                                {upcomingDrives.map((drive) => (
                                    <div key={drive._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{drive.companyName}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{drive.role}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="badge badge-info">{drive.ctc}</span>
                                                    <span className="badge badge-primary">{drive.location}</span>
                                                    <span className="badge bg-gray-100 text-gray-800">
                                                        Min CGPA: {drive.eligibility.minCgpa}
                                                    </span>
                                                </div>
                                            </div>
                                            <Link to="/student/drives" className="btn-primary ml-4 text-sm px-4 py-2">
                                                Apply
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Notifications */}
                    {notifications.length > 0 && (
                        <div className="card mt-8 animate-scale-in">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Notifications</h2>
                            <div className="space-y-3">
                                {notifications.slice(0, 5).map((notif, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-indigo-50 rounded-lg">
                                        <div className="flex-shrink-0 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                                            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-700 flex-1">{notif.message}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default StudentDashboard;
