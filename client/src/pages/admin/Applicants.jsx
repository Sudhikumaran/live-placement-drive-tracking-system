import { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import Loader from '../../components/Loader';

const statusClasses = {
    upcoming: 'badge badge-primary',
    ongoing: 'badge badge-warning',
    closed: 'badge badge-error'
};

const AdminApplicants = () => {
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDriveApplicants();
    }, []);

    const fetchDriveApplicants = async () => {
        try {
            const res = await api.get('/analytics/drive-applicants');
            setDrives(res.data.drives || []);
        } catch (error) {
            console.error('Error fetching drive applicants:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader size="large" text="Loading applicants..." />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[var(--bg-secondary)] dark:bg-gray-900 py-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Applicants by Drive</h1>
                        <p className="text-gray-600 dark:text-gray-400">View each drive with its total applicants.</p>
                    </div>

                    <div className="card p-6">
                        {drives.length === 0 ? (
                            <p className="text-gray-500">No drives found.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="text-xs uppercase text-gray-500 dark:text-gray-400">
                                            <th className="table-head">Company</th>
                                            <th className="table-head">Role</th>
                                            <th className="table-head">CTC</th>
                                            <th className="table-head">Status</th>
                                            <th className="table-head text-right">Applicants</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drives.map((drive) => (
                                            <tr key={drive.driveId} className="table-row">
                                                <td className="table-cell">
                                                    <div className="font-semibold text-gray-900 dark:text-white">{drive.companyName}</div>
                                                </td>
                                                <td className="table-cell text-gray-800 dark:text-gray-200">{drive.role}</td>
                                                <td className="table-cell text-gray-800 dark:text-gray-200">{drive.ctc || '—'}</td>
                                                <td className="table-cell">
                                                    <span className={`${statusClasses[drive.status] || 'badge bg-slate-100 text-gray-700 dark:bg-slate-700 dark:text-gray-100'} capitalize`}>
                                                        {drive.status}
                                                    </span>
                                                </td>
                                                <td className="table-cell text-right font-semibold text-gray-900 dark:text-white">{drive.totalApplicants}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminApplicants;
