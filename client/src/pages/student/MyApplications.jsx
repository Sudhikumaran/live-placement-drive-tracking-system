import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import Loader from '../../components/Loader';
import useSocket from '../../hooks/useSocket';

const MyApplications = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    useSocket(); // Listen for real-time updates

    useEffect(() => {
        fetchApplications();

        // Listen for refetch event
        const handleRefetch = () => fetchApplications();
        window.addEventListener('refetchApplications', handleRefetch);

        return () => {
            window.removeEventListener('refetchApplications', handleRefetch);
        };
    }, []);

    const fetchApplications = async () => {
        try {
            const response = await api.get('/applications/my-applications');
            setApplications(response.data.applications);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            applied: 'badge-info',
            'in-progress': 'badge-warning',
            selected: 'badge-success',
            rejected: 'badge-danger',
            shortlisted: 'badge-success',
            pending: 'badge-info',
        };
        return badges[status] || 'badge badge-info';
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader size="large" text="Loading applications..." />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">My Applications</h1>

                    {applications.length === 0 ? (
                        <div className="card text-center py-12">
                            <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-500 text-lg">No applications yet</p>
                            <p className="text-gray-400 mt-2">Start by applying to placement drives!</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {applications.map((app) => (
                                <div key={app._id} className="card-gradient p-6 sm:p-7 lg:p-8 space-y-6">
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                        <div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                                {app.driveId?.companyName}
                                            </h3>
                                            <p className="text-lg text-gray-700">{app.driveId?.role}</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                Applied on {new Date(app.appliedAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <span className={`self-start badge ${getStatusBadge(app.finalStatus)} capitalize text-sm`}> 
                                            {app.finalStatus}
                                        </span>
                                    </div>

                                    {/* Round Status */}
                                    {app.roundStatus && app.roundStatus.length > 0 && (
                                        <div className="mt-4">
                                            <h4 className="font-semibold text-gray-900 mb-3">Round Progress</h4>
                                            <div className="space-y-3">
                                                {app.roundStatus.map((round, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${round.status === 'selected' || round.status === 'shortlisted' ? 'bg-green-100' :
                                                                    round.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                                                                }`}>
                                                                {round.status === 'selected' || round.status === 'shortlisted' ? (
                                                                    <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : round.status === 'rejected' ? (
                                                                    <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                    </svg>
                                                                ) : (
                                                                    <svg className="w-6 h-6 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            <div>
                                                                <p className="font-semibold text-gray-900">{round.round}</p>
                                                                <p className="text-xs text-gray-500">
                                                                    {new Date(round.updatedAt).toLocaleDateString()}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span className={`badge ${getStatusBadge(round.status)} capitalize`}
                                                        >
                                                            {round.status}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Company Details */}
                                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-500">CTC</p>
                                            <p className="font-semibold text-gray-900">{app.driveId?.ctc}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500">Location</p>
                                            <p className="font-semibold text-gray-900">{app.driveId?.location}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MyApplications;
