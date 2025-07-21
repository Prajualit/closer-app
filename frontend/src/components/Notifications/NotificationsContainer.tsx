"use client"
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import { useSocket } from '@/lib/SocketContext';
import {
    fetchNotifications,
    markAllNotificationsAsRead,
    clearError
} from '@/redux/slice/notificationSlice';
import NotificationComponent from './Notification';

import { store } from '@/redux/Store';
import type { Notification } from '@/redux/slice/notificationSlice';
type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;
const useAppDispatch: () => AppDispatch = useDispatch;
const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

const NotificationsContainer: React.FC = () => {
    const dispatch = useAppDispatch();
    const {
        notifications,
        loading,
        error,
        unreadCount,
        pagination
    } = useAppSelector((state: RootState) => state.notifications);
    const { isConnected } = useSocket();

    useEffect(() => {
        // Fetch all notifications on component mount
        (dispatch as AppDispatch)(fetchNotifications({
            page: 1,
            limit: 20,
            unreadOnly: false
        }));
    }, [dispatch]);

    useEffect(() => {
        // Clear error after 5 seconds
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const handleMarkAllAsRead = () => {
        if (unreadCount > 0) {
            (dispatch as AppDispatch)(markAllNotificationsAsRead());
        }
    };

    const handleLoadMore = () => {
        if (pagination.current < pagination.total && !loading) {
            (dispatch as AppDispatch)(fetchNotifications({
                page: pagination.current + 1,
                limit: 20,
                unreadOnly: false
            }));
        }
    };

    if (loading && notifications.length === 0) {
        return (
            <div className="space-y-4">
                {/* Loading skeleton */}
                {[...Array(5)].map((_, index) => (
                    <div key={index} className="flex items-start space-x-3 p-4 border-b border-neutral-100 dark:border-neutral-700">
                        <div className="w-10 h-10 bg-neutral-200 dark:bg-neutral-600 rounded-full animate-pulse"></div>
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-neutral-200 dark:bg-neutral-600 rounded animate-pulse w-1/2"></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Header with actions */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-200 dark:border-neutral-700">
                <header className='flex items-center justify-between bg-white dark:bg-neutral-900 '>
                    <h1 className='text-[24px] font-light text-neutral-900 dark:text-white '>Notifications ({pagination.count})</h1>
                </header>

                {unreadCount > 0 && (
                    <button
                        onClick={handleMarkAllAsRead}
                        className="text-sm font-light transition-colors text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                    >
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Notifications list */}
            <div className="space-y-0">
                {notifications.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 dark:bg-neutral-800 rounded-full flex items-center justify-center">
                            <svg className="w-8 h-8 text-neutral-400 dark:text-neutral-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2ZM8 7C8 6.44772 8.44772 6 9 6C9.55228 6 10 6.44772 10 7C10 7.55228 9.55228 8 9 8C8.44772 8 8 7.55228 8 7ZM8 10C8 9.44772 8.44772 9 9 9H11C11.5523 9 12 9.44772 12 10C12 10.5523 11.5523 11 11 11H10V13C10 13.5523 9.55228 14 9 14C8.44772 14 8 13.5523 8 13V10Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-neutral-900 dark:text-white mb-2">
                            No notifications yet
                        </h3>
                <p className="text-neutral-500 dark:text-neutral-400">
                    When someone follows you or sends you a message, you&apos;ll see it here.
                </p>
                    </div>
                ) : (
                    <>
                        {notifications.map((notification: Notification) => (
                            <NotificationComponent key={notification._id} notification={notification} />
                        ))}

                        {/* Load more button */}
                        {pagination.current < pagination.total && (
                            <div className="p-4 text-center border-t border-neutral-100 dark:border-neutral-700">
                                <button
                                    onClick={handleLoadMore}
                                    disabled={loading}
                                    className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-neutral-400 dark:disabled:text-neutral-500 transition-colors"
                                >
                                    {loading ? 'Loading...' : 'Load more'}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NotificationsContainer;
