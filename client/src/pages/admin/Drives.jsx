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
        rounds: [{ name: 'Round 1', description: '', date: '' }],
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

    // Round management functions
    const addRound = () => {
        setFormData(prev => ({
            ...prev,
            rounds: [...prev.rounds, { name: `Round ${prev.rounds.length + 1}`, description: '', date: '' }]
        }));
    };

    const removeRound = (index) => {
        if (formData.rounds.length === 1) {
            toast.error('At least one round is required');
            return;
        }
        setFormData(prev => ({
            ...prev,
            rounds: prev.rounds.filter((_, i) => i !== index)
        }));
    };

    const updateRound = (index, field, value) => {
        setFormData(prev => ({
            ...prev,
            rounds: prev.rounds.map((round, i) =>
                i === index ? { ...round, [field]: value } : round
            )
        }));
    };

    const validateForm = () => {
        if (!formData.companyName.trim()) {
            toast.error('Company name is required');
            return false;
        }
        if (!formData.role.trim()) {
            toast.error('Role is required');
            return false;
        }
        if (formData.departments.length === 0) {
            toast.error('Select at least one department');
            return false;
        }
        if (parseFloat(formData.minCgpa) < 0 || parseFloat(formData.minCgpa) > 10) {
            toast.error('CGPA must be between 0 and 10');
            return false;
        }
        if (new Date(formData.deadline) < new Date()) {
            toast.error('Deadline must be in the future');
            return false;
        }
        // Validate rounds
        for (let i = 0; i < formData.rounds.length; i++) {
            if (!formData.rounds[i].name.trim()) {
                toast.error(`Round ${i + 1} name is required`);
                return false;
            }
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) return;

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
            rounds: drive.rounds.length > 0 ? drive.rounds.map(r => ({
                name: r.name,
                description: r.description || '',
                date: r.date ? r.date.split('T')[0] : ''
            })) : [{ name: 'Round 1', description: '', date: '' }],
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
            rounds: [{ name: 'Round 1', description: '', date: '' }],
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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between mb-8">
                        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Manage Drives</h1>
                        <button
                            onClick={() => { setShowModal(true); setEditingDrive(null); resetForm(); }}
                            className="btn btn-primary"
                        >
                            + Create Drive
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                        {drives.map((drive) => (
                            <div key={drive._id} className="card p-6">
                                {(() => {
                                    const deadlineDate = drive.deadline ? new Date(drive.deadline) : null;
                                    const now = Date.now();
                                    const msDiff = deadlineDate ? deadlineDate.getTime() - now : null;
                                    const isPast = msDiff !== null && msDiff < 0;
                                    const isSoon = msDiff !== null && msDiff <= 3 * 24 * 60 * 60 * 1000 && msDiff >= 0;
                                    const daysLeft = msDiff !== null ? Math.max(0, Math.ceil(msDiff / (24 * 60 * 60 * 1000))) : null;

                                    return (
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{drive.companyName}</h3>
                                                <p className="text-lg text-gray-700 dark:text-gray-300 mb-1">{drive.role}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{drive.description}</p>
                                                {deadlineDate && (
                                                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                                                        {isPast && <span className="badge bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-200">Deadline passed</span>}
                                                        {isSoon && !isPast && <span className="badge bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200">Deadline in {Math.max(1, daysLeft)} days</span>}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-3">
                                                <span className={`badge ${drive.status === 'upcoming' ? 'badge-primary' :
                                                        drive.status === 'ongoing' ? 'badge-warning' : 'badge-error'
                                                    } capitalize`}>
                                                    {drive.status}
                                                </span>
                                                <button
                                                    onClick={() => handleEdit(drive)}
                                                    className="btn btn-primary text-sm px-3 py-1"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(drive._id)}
                                                    className="btn btn-secondary text-sm px-3 py-1"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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

                                {/* Display Rounds */}
                                {drive.rounds && drive.rounds.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Rounds ({drive.rounds.length}):</p>
                                        <div className="flex flex-wrap gap-2">
                                            {drive.rounds.map((round, idx) => (
                                                <div key={idx} className="badge bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50">
                                                    {round.name}
                                                    {round.date && ` - ${new Date(round.date).toLocaleDateString()}`}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Enhanced Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                                    {editingDrive ? 'Edit Drive' : 'Create New Drive'}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    {/* Company Details Section */}
                                    <div className="bg-gray-50 dark:bg-gray-900 p-5 rounded-lg border border-gray-200 dark:border-gray-700">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Company Details</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Company Name *</label>
                                                <input
                                                    type="text"
                                                    name="companyName"
                                                    value={formData.companyName}
                                                    onChange={handleInputChange}
                                                    className="input-field"
                                                    placeholder="e.g., Google, Microsoft"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Role/Position *</label>
                                                <input
                                                    type="text"
                                                    name="role"
                                                    value={formData.role}
                                                    onChange={handleInputChange}
                                                    className="input-field"
                                                    placeholder="e.g., Software Engineer"
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-semibold mb-2">Job Description *</label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                className="input-field"
                                                rows="3"
                                                placeholder="Brief description of the role and responsibilities..."
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mt-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">CTC Package *</label>
                                                <input
                                                    type="text"
                                                    name="ctc"
                                                    value={formData.ctc}
                                                    onChange={handleInputChange}
                                                    className="input-field"
                                                    placeholder="e.g., 10-12 LPA or 15 LPA"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Location *</label>
                                                <input
                                                    type="text"
                                                    name="location"
                                                    value={formData.location}
                                                    onChange={handleInputChange}
                                                    className="input-field"
                                                    placeholder="e.g., Bangalore, Remote"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Eligibility Criteria Section */}
                                    <div className="bg-blue-50 p-4 rounded-lg">
                                        <h3 className="text-lg font-semibold mb-4 text-gray-900">Eligibility Criteria</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Minimum CGPA *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    max="10"
                                                    name="minCgpa"
                                                    value={formData.minCgpa}
                                                    onChange={handleInputChange}
                                                    className="input-field"
                                                    placeholder="e.g., 7.5"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2">Application Deadline *</label>
                                                <input
                                                    type="date"
                                                    name="deadline"
                                                    value={formData.deadline}
                                                    onChange={handleInputChange}
                                                    className="input-field"
                                                    min={new Date().toISOString().split('T')[0]}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-4">
                                            <label className="block text-sm font-semibold mb-2">Eligible Departments *</label>
                                            <div className="flex flex-wrap gap-2">
                                                {departmentOptions.map(dept => (
                                                    <button
                                                        key={dept}
                                                        type="button"
                                                        onClick={() => handleDepartmentToggle(dept)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${formData.departments.includes(dept)
                                                                ? 'bg-indigo-600 text-white'
                                                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                                            }`}
                                                    >
                                                        {dept}
                                                    </button>
                                                ))}
                                            </div>
                                            {formData.departments.length === 0 && (
                                                <p className="text-xs text-red-600 mt-1">Please select at least one department</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Rounds Section */}
                                    <div className="bg-green-50 p-4 rounded-lg">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Selection Rounds</h3>
                                            <button
                                                type="button"
                                                onClick={addRound}
                                                className="btn btn-primary text-sm px-3 py-1"
                                            >
                                                + Add Round
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {formData.rounds.map((round, index) => (
                                                <div key={index} className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                                    <div className="flex items-start justify-between mb-3">
                                                        <h4 className="font-semibold text-gray-700 dark:text-white">Round {index + 1}</h4>
                                                        {formData.rounds.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => removeRound(index)}
                                                                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium"
                                                            >
                                                                ✕ Remove
                                                            </button>
                                                        )}
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-3">
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">Round Name *</label>
                                                            <input
                                                                type="text"
                                                                value={round.name}
                                                                onChange={(e) => updateRound(index, 'name', e.target.value)}
                                                                className="input-field text-sm"
                                                                placeholder="e.g., Technical Round"
                                                                required
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">Description</label>
                                                            <input
                                                                type="text"
                                                                value={round.description}
                                                                onChange={(e) => updateRound(index, 'description', e.target.value)}
                                                                className="input-field text-sm"
                                                                placeholder="Optional round details"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="block text-xs font-semibold mb-1">Scheduled Date</label>
                                                            <input
                                                                type="date"
                                                                value={round.date}
                                                                onChange={(e) => updateRound(index, 'date', e.target.value)}
                                                                className="input-field text-sm"
                                                                min={new Date().toISOString().split('T')[0]}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Drive Status */}
                                    <div>
                                        <label className="block text-sm font-semibold mb-2">Drive Status</label>
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

                                    {/* Form Actions */}
                                    <div className="flex space-x-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                                        <button type="submit" className="btn btn-primary flex-1">
                                            {editingDrive ? 'Update Drive' : 'Create Drive'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingDrive(null); }}
                                            className="btn btn-secondary flex-1"
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
