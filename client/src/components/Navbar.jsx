import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
    const { user, logout } = useAuth();
    const location = useLocation();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const navLinkClass = (path) => {
        return `px-4 py-2 rounded-lg font-medium transition-all duration-200 ${isActive(path)
            ? 'bg-indigo-600 text-white shadow-md'
            : 'text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`;
    };

    // Admin navigation
    const adminLinks = [
        { path: '/admin/dashboard', label: 'Dashboard' },
        { path: '/admin/drives', label: 'Drives' },
        { path: '/admin/shortlist', label: 'Upload Shortlist' },
        { path: '/admin/analytics', label: 'Analytics' },
    ];

    // Student navigation
    const studentLinks = [
        { path: '/student/dashboard', label: 'Dashboard' },
        { path: '/student/drives', label: 'Drives' },
        { path: '/student/applications', label: 'My Applications' },
        { path: '/student/profile', label: 'Profile' },
    ];

    const links = user?.role === 'admin' ? adminLinks : studentLinks;

    return (
        <nav className="bg-white dark:bg-gray-800 shadow-md sticky top-0 z-50 transition-colors duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="flex items-center">
                        <Link to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'} className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-lg"></div>
                            <span className="text-xl font-bold text-gray-900 dark:text-white">PlacementTracker</span>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center space-x-2">
                        {links.map((link) => (
                            <Link key={link.path} to={link.path} className={navLinkClass(link.path)}>
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    {/* User Menu */}
                    <div className="flex items-center space-x-4">
                        <ThemeToggle />
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
                        </div>
                        <button
                            onClick={logout}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors duration-200"
                        >
                            Logout
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className="md:hidden pb-3 flex flex-wrap gap-2">
                    {links.map((link) => (
                        <Link key={link.path} to={link.path} className={navLinkClass(link.path)}>
                            {link.label}
                        </Link>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
