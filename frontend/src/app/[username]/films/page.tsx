'use client';
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import FilmsViewer, { Film } from '@/components/Films/FilmsViewer';
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const FilmsPage = () => {
    const { username } = useParams();
    const [films, setFilms] = useState<Film[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadInitialFilms();
    }, []);

    const loadInitialFilms = async () => {
        try {
            setLoading(true);
            const response = await makeAuthenticatedRequest(
                `${API_ENDPOINTS.POSTS}?page=1&limit=10&type=video`,
                {
                    method: 'GET',
                }
            );

            if (response.ok) {
                const data = await response.json();
                setFilms((data.data?.posts as Film[]) || []);
            } else {
                setError('Failed to load films');
            }
        } catch (error) {
            console.error('Error loading films:', error);
            setError('Error loading films');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="h-screen bg-black flex items-center justify-center">
                <LoadingSpinner size="lg" color="white" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen bg-neutral-900 dark:bg-black flex items-center justify-center text-neutral-100 dark:text-white">
                <div className="text-center">
                    <p className="text-lg mb-4">{error}</p>
                    <button 
                        onClick={loadInitialFilms}
                        className="px-6 py-2 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white rounded-full hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return <FilmsViewer initialFilms={films} username={typeof username === 'string' ? username : ''} />;
};

export default FilmsPage;
