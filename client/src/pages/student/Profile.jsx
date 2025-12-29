import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/Navbar';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [profile, setProfile] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        department: '',
        cgpa: '',
        skills: [],
        linkedIn: '',
        github: '',
        portfolio: '',
        emailPreferences: {
            shortlistUpdates: true,
            driveAnnouncements: true,
            applicationConfirmations: true
        }
    });
    const [newSkill, setNewSkill] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const { data } = await api.get('/profile');
            if (data.success) {
                setProfile({
                    name: data.data.name || '',
                    email: data.data.email || '',
                    phone: data.data.phone || '',
                    address: data.data.address || '',
                    department: data.data.department || '',
                    cgpa: data.data.cgpa || '',
                    skills: data.data.skills || [],
                    linkedIn: data.data.linkedIn || '',
                    github: data.data.github || '',
                    portfolio: data.data.portfolio || '',
                    emailPreferences: data.data.emailPreferences || {
                        shortlistUpdates: true,
                        driveAnnouncements: true,
                        applicationConfirmations: true
                    },
                    profilePhoto: data.data.profilePhoto,
                    resumeUrl: data.data.resumeUrl
                });
            }
        } catch (error) {
            toast.error('Failed to load profile');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile(prev => ({ ...prev, [name]: value }));
    };

    const handleEmailPrefChange = (e) => {
        const { name, checked } = e.target;
        setProfile(prev => ({
            ...prev,
            emailPreferences: {
                ...prev.emailPreferences,
                [name]: checked
            }
        }));
    };

    const addSkill = () => {
        if (newSkill.trim() && !profile.skills.includes(newSkill.trim())) {
            setProfile(prev => ({
                ...prev,
                skills: [...prev.skills, newSkill.trim()]
            }));
            setNewSkill('');
        }
    };

    const removeSkill = (skillToRemove) => {
        setProfile(prev => ({
            ...prev,
            skills: prev.skills.filter(skill => skill !== skillToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data } = await api.put('/profile', profile);
            if (data.success) {
                toast.success('Profile updated successfully!');
                fetchProfile();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('profilePhoto', file);
        setUploading(true);

        try {
            const { data } = await api.post('/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                toast.success('Profile photo uploaded!');
                fetchProfile();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload photo');
        } finally {
            setUploading(false);
        }
    };

    const handleResumeUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('resume', file);
        setUploading(true);

        try {
            const { data } = await api.post('/profile/resume', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                toast.success('Resume uploaded successfully!');
                fetchProfile();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to upload resume');
        } finally {
            setUploading(false);
        }
    };

    const handleResumeDelete = async () => {
        if (!window.confirm('Are you sure you want to delete your resume?')) return;

        try {
            const { data } = await api.delete('/profile/resume');
            if (data.success) {
                toast.success('Resume deleted');
                fetchProfile();
            }
        } catch (error) {
            toast.error('Failed to delete resume');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-50 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-950">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your personal information and preferences</p>
                </div>

                {/* Profile Photo Section */}
                <div className="card mb-6">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Profile Photo</h2>
                    <div className="flex items-center space-x-6">
                        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-indigo-600 to-blue-600 flex items-center justify-center text-white text-3xl font-bold overflow-hidden">
                            {profile.profilePhoto ? (
                                <img src={`http://localhost:5000${profile.profilePhoto}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                profile.name?.charAt(0)?.toUpperCase() || 'U'
                            )}
                        </div>
                        <div>
                            <label className="btn-secondary cursor-pointer">
                                {uploading ? 'Uploading...' : 'Upload Photo'}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">JPG, PNG (Max 5MB)</p>
                        </div>
                    </div>
                </div>

                {/* Personal Information */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={profile.name}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={profile.email}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={profile.phone}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    placeholder="+91 XXXXX XXXXX"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Department</label>
                                <input
                                    type="text"
                                    name="department"
                                    value={profile.department}
                                    onChange={handleInputChange}
                                    className="input-field"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CGPA</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    name="cgpa"
                                    value={profile.cgpa}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    min="0"
                                    max="10"
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                                <textarea
                                    name="address"
                                    value={profile.address}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    rows="3"
                                    placeholder="Your full address"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Skills</h2>
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                                className="input-field flex-1"
                                placeholder="Add a skill (e.g., React, Python)"
                            />
                            <button type="button" onClick={addSkill} className="btn-secondary">
                                Add
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, index) => (
                                <span key={index} className="badge badge-primary flex items-center gap-2">
                                    {skill}
                                    <button
                                        type="button"
                                        onClick={() => removeSkill(skill)}
                                        className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                                    >
                                        ×
                                    </button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Social Links */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Social Links</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LinkedIn</label>
                                <input
                                    type="url"
                                    name="linkedIn"
                                    value={profile.linkedIn}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    placeholder="https://linkedin.com/in/yourprofile"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GitHub</label>
                                <input
                                    type="url"
                                    name="github"
                                    value={profile.github}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    placeholder="https://github.com/yourusername"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Portfolio</label>
                                <input
                                    type="url"
                                    name="portfolio"
                                    value={profile.portfolio}
                                    onChange={handleInputChange}
                                    className="input-field"
                                    placeholder="https://yourportfolio.com"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Resume */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Resume</h2>
                        {profile.resumeUrl ? (
                            <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <div className="flex items-center space-x-3">
                                    <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">Resume Uploaded</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Click to view or replace</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <a
                                        href={`http://localhost:5000${profile.resumeUrl}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-secondary"
                                    >
                                        View
                                    </a>
                                    <button type="button" onClick={handleResumeDelete} className="btn-danger">
                                        Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-10 h-10 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        {uploading ? 'Uploading...' : 'Click to upload resume'}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">PDF, DOC, DOCX (Max 5MB)</p>
                                </div>
                                <input
                                    type="file"
                                    accept=".pdf,.doc,.docx"
                                    onChange={handleResumeUpload}
                                    className="hidden"
                                    disabled={uploading}
                                />
                            </label>
                        )}
                    </div>

                    {/* Email Preferences */}
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Email Notifications</h2>
                        <div className="space-y-3">
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="shortlistUpdates"
                                    checked={profile.emailPreferences.shortlistUpdates}
                                    onChange={handleEmailPrefChange}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Shortlist Updates</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="driveAnnouncements"
                                    checked={profile.emailPreferences.driveAnnouncements}
                                    onChange={handleEmailPrefChange}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">New Drive Announcements</span>
                            </label>
                            <label className="flex items-center space-x-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="applicationConfirmations"
                                    checked={profile.emailPreferences.applicationConfirmations}
                                    onChange={handleEmailPrefChange}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                                <span className="text-gray-700 dark:text-gray-300">Application Confirmations</span>
                            </label>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                        >
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
