import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState({ drives: [], students: [] });
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const delaySearch = setTimeout(() => {
            if (query.trim().length > 2) {
                performSearch();
            } else {
                setResults({ drives: [], students: [] });
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(delaySearch);
    }, [query]);

    const performSearch = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(`http://localhost:5000/api/search?q=${query}`);
            if (data.success) {
                setResults(data.data);
                setIsOpen(true);
            }
        } catch (error) {
            console.error('Search error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleResultClick = (result) => {
        setIsOpen(false);
        setQuery('');
        if (result.type === 'drive') {
            navigate('/student/drives'); // or admin/drives based on role
        }
    };

    const totalResults = results.drives.length + results.students.length;

    return (
        <div ref={searchRef} className="relative w-full max-w-md">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search drives, companies..."
                    className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                />
                <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                </svg>
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && totalResults > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
                    {/* Drives */}
                    {results.drives.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                    Placement Drives ({results.drives.length})
                                </h3>
                            </div>
                            {results.drives.map((drive) => (
                                <button
                                    key={drive.id}
                                    onClick={() => handleResultClick(drive)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 dark:text-white">
                                                {drive.title}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                {drive.subtitle}
                                            </p>
                                        </div>
                                        <span
                                            className={`ml-2 px-2 py-1 text-xs font-semibold rounded ${drive.status === 'ongoing'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                                                    : drive.status === 'upcoming'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            {drive.status}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Students (Admin only) */}
                    {results.students.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                    Students ({results.students.length})
                                </h3>
                            </div>
                            {results.students.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleResultClick(student)}
                                    className="w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {student.title}
                                    </p>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {student.subtitle}
                                    </p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* No Results */}
            {isOpen && query.trim().length > 2 && totalResults === 0 && !loading && (
                <div className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-4">
                    <p className="text-center text-gray-500 dark:text-gray-400">
                        No results found for "{query}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
