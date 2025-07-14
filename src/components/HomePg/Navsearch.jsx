'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import search from "@/assets/search.png";
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '@/lib/api';

const Navsearch = () => {
    const [query, setQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef(null);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setShowResults(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const searchUsers = async () => {
            if (query.trim().length < 2) {
                setSearchResults([]);
                setShowResults(false);
                return;
            }

            setIsSearching(true);
            try {
                const response = await fetch(API_ENDPOINTS.USER_SEARCH(encodeURIComponent(query)), {
                    credentials: 'include',
                });
                const data = await response.json();

                if (data.success) {
                    setSearchResults(data.data || []);
                    setShowResults(true);
                } else {
                    setSearchResults([]);
                    setShowResults(false);
                }
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
                setShowResults(false);
            } finally {
                setIsSearching(false);
            }
        };

        const debounceTimer = setTimeout(searchUsers, 300);
        return () => clearTimeout(debounceTimer);
    }, [query]);

    const handleUserClick = (user) => {
        setQuery('');
        setShowResults(false);
        router.push(`/profile/${user._id}`);
    };

    return (
        <div ref={searchRef} className="relative w-full max-w-md mx-auto">
            <div className="transition-all duration-300 hover:shadow-lg focus-within:shadow-lg flex items-center rounded-[8px] px-3 py-2 bg-white dark:bg-neutral-800 space-x-2 shadow-md border border-neutral-200 dark:border-neutral-700">
                <Image src={search} alt="Search" />
                <input
                    placeholder="Search for users..."
                    className="bg-transparent outline-none w-full text-neutral-900 dark:text-white placeholder-neutral-500 dark:placeholder-neutral-400"
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.trim().length >= 2 && setShowResults(true)}
                />
            </div>

            {/* Search Results Dropdown */}
            {showResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {isSearching ? (
                        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                            Searching...
                        </div>
                    ) : searchResults.length > 0 ? (
                        searchResults.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center space-x-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-700 cursor-pointer border-b dark:border-neutral-600 last:border-b-0"
                                onClick={() => handleUserClick(user)}
                            >
                                <div className="w-10 h-10 rounded-full overflow-hidden">
                                    <Image
                                        src={user.avatarUrl}
                                        alt={user.name}
                                        width={40}
                                        height={40}
                                        className="object-cover w-full h-full"
                                    />
                                </div>
                                <div className="flex-1">
                                    <div className="font-medium dark:text-white">{user.name}</div>
                                    <div className="text-sm text-neutral-500 dark:text-neutral-400">@{user.username}</div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="p-4 text-center text-neutral-500 dark:text-neutral-400">
                            No users found
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Navsearch;
