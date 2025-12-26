import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import Loader from '../../components/Loader';
import api from '../../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminAnalytics = () => {
    const [loading, setLoading] = useState(true);
    const [placementStats, setPlacementStats] = useState([]);
    const [companyStats, setCompanyStats] = useState([]);
    const [studentStats, setStudentStats] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const [placementRes, companyRes, studentRes] = await Promise.all([
                api.get('/analytics/placement'),
                api.get('/analytics/companies'),
                api.get('/analytics/students')
            ]);

            setPlacementStats(placementRes.data.stats);
            setCompanyStats(companyRes.data.stats);
            setStudentStats(studentRes.data.stats);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const COLORS = ['#6366f1', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen flex items-center justify-center">
                    <Loader size="large" text="Loading analytics..." />
                </div>
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">Analytics Dashboard</h1>

                    {/* Overall Stats */}
                    {studentStats && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div className="card-gradient">
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Students</p>
                                <p className="text-3xl font-bold text-indigo-600">{studentStats.totalStudents}</p>
                            </div>
                            <div className="card-gradient">
                                <p className="text-sm font-medium text-gray-600 mb-1">Placed Students</p>
                                <p className="text-3xl font-bold text-green-600">{studentStats.placedCount}</p>
                            </div>
                            <div className="card-gradient">
                                <p className="text-sm font-medium text-gray-600 mb-1">Placement Rate</p>
                                <p className="text-3xl font-bold text-blue-600">{studentStats.placementPercentage}%</p>
                            </div>
                            <div className="card-gradient">
                                <p className="text-sm font-medium text-gray-600 mb-1">Total Applications</p>
                                <p className="text-3xl font-bold text-purple-600">{studentStats.totalApplications}</p>
                            </div>
                        </div>
                    )}

                    {/* Department-wise Placement */}
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Department-wise Placement</h2>
                        {placementStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={placementStats}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="placed" fill="#10b981" name="Placed" />
                                    <Bar dataKey="total" fill="#6366f1" name="Total" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No data available</p>
                        )}
                    </div>

                    {/* Department Placement Percentage */}
                    <div className="card mb-8">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Placement Percentage by Department</h2>
                        {placementStats.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                <PieChart>
                                    <Pie
                                        data={placementStats}
                                        dataKey="percentage"
                                        nameKey="department"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={150}
                                        label={(entry) => `${entry.department}: ${entry.percentage}%`}
                                    >
                                        {placementStats.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No data available</p>
                        )}
                    </div>

                    {/* Company-wise Offers */}
                    <div className="card">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">Company-wise Offers</h2>
                        {companyStats.length > 0 ? (
                            <>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart data={companyStats.slice(0, 10)}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="company" angle={-45} textAnchor="end" height={120} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="offers" fill="#8b5cf6" name="Offers" />
                                    </BarChart>
                                </ResponsiveContainer>

                                {/* Company Table */}
                                <div className="mt-8 overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Company</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                                                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">CTC</th>
                                                <th className="px-4 py-3 text-center text-sm font-semibold text-gray-900">Offers</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {companyStats.map((company, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm text-gray-900">{company.company}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{company.role}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{company.ctc}</td>
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        <span className="badge badge-success">{company.offers}</span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        ) : (
                            <p className="text-gray-500 text-center py-8">No data available</p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminAnalytics;
