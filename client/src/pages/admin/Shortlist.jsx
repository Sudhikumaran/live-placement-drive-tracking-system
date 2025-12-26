import { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const AdminShortlist = () => {
    const [drives, setDrives] = useState([]);
    const [selectedDrive, setSelectedDrive] = useState('');
    const [round, setRound] = useState('');
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchDrives();
    }, []);

    const fetchDrives = async () => {
        try {
            const response = await api.get('/drives');
            setDrives(response.data.drives);
        } catch (error) {
            console.error('Error fetching drives:', error);
        }
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && selectedFile.name.endsWith('.xlsx')) {
            setFile(selectedFile);
        } else {
            toast.error('Please select a valid Excel file (.xlsx)');
            e.target.value = '';
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedDrive || !round || !file) {
            toast.error('Please fill all fields and select a file');
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('driveId', selectedDrive);
            formData.append('round', round);

            await api.post(`/drives/${selectedDrive}/shortlist`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            toast.success('Shortlist uploaded successfully and notifications sent!');

            // Reset form
            setSelectedDrive('');
            setRound('');
            setFile(null);
            document.getElementById('file-input').value = '';
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to upload shortlist';
            toast.error(message);
        } finally {
            setUploading(false);
        }
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">Upload Shortlist</h1>

                    <div className="card-gradient">
                        <div className="mb-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-2">Instructions</h2>
                            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 text-sm text-gray-700 space-y-2">
                                <p>• Your Excel file should have the following columns: <strong>Email</strong>, <strong>Status</strong></p>
                                <p>• Status values: <strong>shortlisted</strong>, <strong>rejected</strong>, <strong>selected</strong>, <strong>pending</strong></p>
                                <p>• Example:</p>
                                <div className="mt-2 bg-white rounded p-2 font-mono text-xs overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b">
                                                <th className="text-left p-2">Email</th>
                                                <th className="text-left p-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <tr className="border-b">
                                                <td className="p-2">student1@college.edu</td>
                                                <td className="p-2">shortlisted</td>
                                            </tr>
                                            <tr>
                                                <td className="p-2">student2@college.edu</td>
                                                <td className="p-2">rejected</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                                <p className="mt-3 text-indigo-700 font-semibold">
                                    ⚡ Real-time notifications will be sent to all affected students!
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Placement Drive
                                </label>
                                <select
                                    value={selectedDrive}
                                    onChange={(e) => setSelectedDrive(e.target.value)}
                                    className="input-field"
                                    required
                                >
                                    <option value="">-- Select a drive --</option>
                                    {drives.map((drive) => (
                                        <option key={drive._id} value={drive._id}>
                                            {drive.companyName} - {drive.role}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Round Name
                                </label>
                                <input
                                    type="text"
                                    value={round}
                                    onChange={(e) => setRound(e.target.value)}
                                    className="input-field"
                                    placeholder="e.g., Round 1, Technical Round, HR Round"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Upload Excel File (.xlsx)
                                </label>
                                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-indigo-400 transition-colors">
                                    <div className="space-y-1 text-center">
                                        <svg
                                            className="mx-auto h-12 w-12 text-gray-400"
                                            stroke="currentColor"
                                            fill="none"
                                            viewBox="0 0 48 48"
                                        >
                                            <path
                                                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                strokeWidth={2}
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        <div className="flex text-sm text-gray-600">
                                            <label
                                                htmlFor="file-input"
                                                className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500"
                                            >
                                                <span>Upload a file</span>
                                                <input
                                                    id="file-input"
                                                    type="file"
                                                    className="sr-only"
                                                    accept=".xlsx"
                                                    onChange={handleFileChange}
                                                    required
                                                />
                                            </label>
                                            <p className="pl-1">or drag and drop</p>
                                        </div>
                                        <p className="text-xs text-gray-500">Excel file (.xlsx) only</p>
                                        {file && (
                                            <p className="text-sm text-green-600 font-semibold mt-2">
                                                ✓ {file.name}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={uploading}
                                className="w-full btn-primary"
                            >
                                {uploading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Uploading and sending notifications...
                                    </span>
                                ) : (
                                    'Upload Shortlist'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </>
    );
};

export default AdminShortlist;
