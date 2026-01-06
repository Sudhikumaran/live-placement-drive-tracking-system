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
            navigate('/student/drives');
        }
    };

    const totalResults = results.drives.length + results.students.length;

    return (
        <div ref={searchRef} className="relative w-full max-w-md hidden sm:block">
            <div className="relative">
                <svg
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
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
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length > 2 && setIsOpen(true)}
                    placeholder="Search drives, companies..."
                    className="input-field pl-10"
                />
                {loading && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Search Results Dropdown */}
            {isOpen && totalResults > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
                    {/* Drives */}
                    {results.drives.length > 0 && (
                        <div>
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                    Drives ({results.drives.length})
                                </h3>
                            </div>
                            {results.drives.map((drive) => (
                                <button
                                    key={drive.id}
                                    onClick={() => handleResultClick(drive)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">
                                                {drive.title}
                                            </p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 truncate">
                                                {drive.subtitle}
                                            </p>
                                        </div>
                                        <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${drive.status === 'ongoing'
                                                    ? 'badge-success'
                                                    : drive.status === 'upcoming'
                                                        ? 'badge-primary'
                                                        : 'bg-slate-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300'
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
                            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                                <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                                    Students ({results.students.length})
                                </h3>
                            </div>
                            {results.students.map((student) => (
                                <button
                                    key={student.id}
                                    onClick={() => handleResultClick(student)}
                                    className="w-full px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors border-b border-slate-100 dark:border-slate-700 last:border-0"
                                >
                                    <p className="font-medium text-gray-900 dark:text-white text-sm">
                                        {student.title}
                                    </p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
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
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-4">
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                        No results found for "{query}"
                    </p>
                </div>
            )}
        </div>
    );
};

export default SearchBar;
