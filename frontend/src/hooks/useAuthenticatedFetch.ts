"use client";
import { useCallback } from 'react';
import { API_ENDPOINTS } from '@/lib/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const useAuthenticatedFetch = () => {
  const authenticatedFetch = useCallback(async (url: string, options: FetchOptions = {}) => {
    // Get tokens from localStorage as fallback
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    
    const requestOptions: RequestInit = {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        // Include Authorization header if we have a token in localStorage
        ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, requestOptions);
      
      // If we get 401 and we have tokens in localStorage, try to refresh
      if (response.status === 401 && typeof window !== 'undefined') {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (refreshToken) {
          console.log('🔄 Access token expired, attempting refresh...');
          
          try {
            const refreshResponse = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ refreshToken }),
            });

            if (refreshResponse.ok) {
              const refreshData = await refreshResponse.json();
              
              // Update localStorage with new tokens
              if (refreshData.data.accessToken) {
                localStorage.setItem('accessToken', refreshData.data.accessToken);
              }
              if (refreshData.data.refreshToken) {
                localStorage.setItem('refreshToken', refreshData.data.refreshToken);
              }
              
              console.log('✅ Token refreshed successfully, retrying original request...');
              
              // Retry the original request with new token
              const newRequestOptions = {
                ...requestOptions,
                headers: {
                  ...requestOptions.headers,
                  Authorization: `Bearer ${refreshData.data.accessToken}`,
                },
              };
              
              return await fetch(url, newRequestOptions);
            } else {
              console.log('❌ Token refresh failed, redirecting to login...');
              // Clear tokens and redirect to login
              localStorage.removeItem('accessToken');
              localStorage.removeItem('refreshToken');
              window.location.href = '/sign-in';
              throw new Error('Authentication failed');
            }
          } catch (refreshError) {
            console.error('💥 Token refresh error:', refreshError);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/sign-in';
            throw refreshError;
          }
        } else {
          console.log('❌ No refresh token available, redirecting to login...');
          window.location.href = '/sign-in';
          throw new Error('No refresh token available');
        }
      }
      
      return response;
    } catch (error) {
      console.error('💥 Authenticated fetch error:', error);
      throw error;
    }
  }, []);

  return authenticatedFetch;
};
