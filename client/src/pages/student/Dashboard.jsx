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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Welcome Section */}
                    <div className="mb-8 animate-fade-in">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                            Welcome back, {user?.name}!
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {user?.department} • CGPA: {user?.cgpa}
                        </p>
                    </div>

                    {/* Stats Cards - Stripe Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
                        {/* Applications Card */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Applications</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.applied}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Total applied</p>
                                </div>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Shortlisted Card */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Shortlisted</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.shortlisted}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">In process</p>
                                </div>
                                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Offers Card */}
                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Offers</p>
                                    <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.offers}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">Received</p>
                                </div>
                                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Upcoming Drives */}
                    <div className="card p-6 animate-fade-in">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Upcoming Drives</h2>
                            <Link to="/student/drives" className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-semibold">
                                View All →
                            </Link>
                        </div>

                        {upcomingDrives.length === 0 ? (
                            <div className="text-center py-12">
                                <svg className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                </svg>
                                <p className="text-gray-600 dark:text-gray-400">No upcoming drives available</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {upcomingDrives.map((drive) => (
                                    <div key={drive._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{drive.companyName}</h3>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{drive.role}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    <span className="badge badge-primary text-xs">{drive.ctc}</span>
                                                    <span className="badge bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">{drive.location}</span>
                                                </div>
                                            </div>
                                            <Link to="/student/drives" className="btn btn-primary ml-4 text-sm px-4 py-2 whitespace-nowrap">
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
                        <div className="card p-6 mt-8 animate-fade-in">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Updates</h2>
                            <div className="space-y-3">
                                {notifications.slice(0, 5).map((notif, index) => (
                                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800/50">
                                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-full flex items-center justify-center mt-0.5">
                                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M10.5 1.5H5.75A4.25 4.25 0 001.5 5.75v8.5A4.25 4.25 0 005.75 18.5h8.5a4.25 4.25 0 004.25-4.25v-5.5" />
                                            </svg>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 flex-1">{notif.message}</p>
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
