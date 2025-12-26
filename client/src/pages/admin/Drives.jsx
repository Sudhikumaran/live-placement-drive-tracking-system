import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import Loader from '../../components/Loader';
import toast from 'react-hot-toast';

const AdminDrives = () => {
    const [drives, setDrives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingDrive, setEditingDrive] = useState(null);
    const [formData, setFormData] = useState({
        companyName: '',
        role: '',
        description: '',
        ctc: '',
        location: '',
        deadline: '',
        status: 'upcoming',
        minCgpa: '',
        departments: [],
        rounds: [{ name: 'Round 1', description: '' }],
    });

    const departmentOptions = ['Computer Science', 'Information Technology', 'Electronics', 'Mechanical', 'Civil', 'Electrical'];

    useEffect(() => {
        fetchDrives();
    }, []);

    const fetchDrives = async () => {
        try {
            const response = await api.get('/drives');
            setDrives(response.data.drives);
        } catch (error) {
            console.error('Error fetching drives:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleDepartmentToggle = (dept) => {
        setFormData(prev => ({
            ...prev,
            departments: prev.departments.includes(dept)
                ? prev.departments.filter(d => d !== dept)
                : [...prev.departments, dept]
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                ...formData,
                eligibility: {
                    minCgpa: parseFloat(formData.minCgpa),
                    departments: formData.departments
                }
            };

            if (editingDrive) {
                await api.put(`/drives/${editingDrive._id}`, payload);
                toast.success('Drive updated successfully!');
            } else {
                await api.post('/drives', payload);
                toast.success('Drive created successfully!');
            }

            setShowModal(false);
            setEditingDrive(null);
            resetForm();
            fetchDrives();
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to save drive';
            toast.error(message);
        }
    };

    const handleEdit = (drive) => {
        setEditingDrive(drive);
        setFormData({
            companyName: drive.companyName,
            role: drive.role,
            description: drive.description,
            ctc: drive.ctc,
            location: drive.location,
            deadline: drive.deadline.split('T')[0],
            status: drive.status,
            minCgpa: drive.eligibility.minCgpa,
            departments: drive.eligibility.departments,
            rounds: drive.rounds.length > 0 ? drive.rounds : [{ name: 'Round 1', description: '' }],
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this drive?')) return;

        try {
            await api.delete(`/drives/${id}`);
            toast.success('Drive deleted successfully!');
            fetchDrives();
        } catch (error) {
            toast.error('Failed to delete drive');
        }
    };

    const resetForm = () => {
        setFormData({
            companyName: '',
            role: '',
            description: '',
            ctc: '',
            location: '',
            deadline: '',
            status: 'upcoming',
            minCgpa: '',
            departments: [],
            rounds: [{ name: 'Round 1', description: '' }],
        });
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
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">Manage Drives</h1>
                        <button
                            onClick={() => { setShowModal(true); setEditingDrive(null); resetForm(); }}
                            className="btn-primary"
                        >
                            + Create Drive
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {drives.map((drive) => (
                            <div key={drive._id} className="card-gradient">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{drive.companyName}</h3>
                                        <p className="text-lg text-gray-700">{drive.role}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <span className={`badge ${drive.status === 'upcoming' ? 'badge-info' :
                                                drive.status === 'ongoing' ? 'badge-warning' : 'badge-danger'
                                            } capitalize`}>
                                            {drive.status}
                                        </span>
                                        <button
                                            onClick={() => handleEdit(drive)}
                                            className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(drive._id)}
                                            className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
                            </div>
                        ))}
                    </div>

                    {/* Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                            <div className="bg-white rounded-xl p-6 max-w-2xl w-full my-8">
                                <h2 className="text-2xl font-bold mb-6">
                                    {editingDrive ? 'Edit Drive' : 'Create New Drive'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Company Name</label>
                                            <input
                                                type="text"
                                                name="companyName"
                                                value={formData.companyName}
                                                onChange={handleInputChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Role</label>
                                            <input
                                                type="text"
                                                name="role"
                                                value={formData.role}
                                                onChange={handleInputChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Description</label>
                                        <textarea
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            className="input-field"
                                            rows="3"
                                            required
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">CTC</label>
                                            <input
                                                type="text"
                                                name="ctc"
                                                value={formData.ctc}
                                                onChange={handleInputChange}
                                                className="input-field"
                                                placeholder="e.g., 10-12 LPA"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Location</label>
                                            <input
                                                type="text"
                                                name="location"
                                                value={formData.location}
                                                onChange={handleInputChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Min CGPA</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                name="minCgpa"
                                                value={formData.minCgpa}
                                                onChange={handleInputChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold mb-2">Deadline</label>
                                            <input
                                                type="date"
                                                name="deadline"
                                                value={formData.deadline}
                                                onChange={handleInputChange}
                                                className="input-field"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Status</label>
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="input-field"
                                        >
                                            <option value="upcoming">Upcoming</option>
                                            <option value="ongoing">Ongoing</option>
                                            <option value="closed">Closed</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Eligible Departments</label>
                                        <div className="flex flex-wrap gap-2">
                                            {departmentOptions.map(dept => (
                                                <button
                                                    key={dept}
                                                    type="button"
                                                    onClick={() => handleDepartmentToggle(dept)}
                                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${formData.departments.includes(dept)
                                                            ? 'bg-indigo-600 text-white'
                                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                        }`}
                                                >
                                                    {dept}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex space-x-3 pt-4">
                                        <button type="submit" className="btn-primary flex-1">
                                            {editingDrive ? 'Update Drive' : 'Create Drive'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingDrive(null); }}
                                            className="btn-secondary flex-1"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AdminDrives;
