// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// API endpoints
type EndpointFn = (...args: any[]) => string;
interface APIEndpoints {
  LOGIN: string;
  REGISTER: string;
  REFRESH_TOKEN: string;
  LOGOUT: string;
  DELETE_ACCOUNT: string;
  GOOGLE_AUTH: string;
  USER_PROFILE: EndpointFn;
  USER_PHOTOS: EndpointFn;
  USER_FILMS: EndpointFn;
  FOLLOW_STATUS: EndpointFn;
  FOLLOW: string;
  UNFOLLOW: string;
  UPDATE_PROFILE: string;
  VERIFY_PASSWORD: string;
  CHANGE_PASSWORD: string;
  POSTS: string;
  GET_SINGLE_POST: EndpointFn;
  LIKE_POST: string;
  UNLIKE_POST: string;
  ADD_COMMENT: string;
  GET_COMMENTS: EndpointFn;
  GET_LIKES_COUNT: EndpointFn;
  SUGGESTED_USERS: string;
  USER_ACTIVITY: string;
  CHAT_ROOM: EndpointFn;
  CHAT_ROOMS: string;
  CHAT_MESSAGES: EndpointFn;
  CHAT_MESSAGE: string;
  MARK_MESSAGES_READ: EndpointFn;
  USER_SEARCH: EndpointFn;
  CHATBOT_MESSAGE: string;
  CHATBOT_ROOM: string;
  CHATBOT_MESSAGES: string;
  CREATE_MEDIA: string;
  NOTIFICATIONS: string;
  NOTIFICATION_READ: EndpointFn;
  NOTIFICATION_DELETE: EndpointFn;
  NOTIFICATION_MARK_ALL_READ: string;
  NOTIFICATION_UNREAD_COUNT: string;
}

export const API_ENDPOINTS: APIEndpoints = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/v1/users/login`,
  REGISTER: `${API_BASE_URL}/api/v1/users/register`,
  REFRESH_TOKEN: `${API_BASE_URL}/api/v1/users/refresh-token`,
  LOGOUT: `${API_BASE_URL}/api/v1/users/logout`,
  DELETE_ACCOUNT: `${API_BASE_URL}/api/v1/users/delete-account`,
  GOOGLE_AUTH: `${API_BASE_URL}/auth/google`,
  // User endpoints
  USER_PROFILE: (userId: string) => `${API_BASE_URL}/api/v1/users/profile/${userId}`,
  USER_PHOTOS: (userId: string) => `${API_BASE_URL}/api/v1/users/photos/${userId}`,
  USER_FILMS: (userId: string) => `${API_BASE_URL}/api/v1/users/films/${userId}`,
  FOLLOW_STATUS: (userId: string) => `${API_BASE_URL}/api/v1/users/follow-status/${userId}`,
  FOLLOW: `${API_BASE_URL}/api/v1/users/follow`,
  UNFOLLOW: `${API_BASE_URL}/api/v1/users/unfollow`,
  UPDATE_PROFILE: `${API_BASE_URL}/api/v1/users/update-profile`,
  VERIFY_PASSWORD: `${API_BASE_URL}/api/v1/users/verify-password`,
  CHANGE_PASSWORD: `${API_BASE_URL}/api/v1/users/change-password`,
  // Posts endpoints
  POSTS: `${API_BASE_URL}/api/v1/posts`,
  GET_SINGLE_POST: (postId: string, mediaId: string) => `${API_BASE_URL}/api/v1/posts/${postId}/${mediaId}`,
  LIKE_POST: `${API_BASE_URL}/api/v1/posts/like`,
  UNLIKE_POST: `${API_BASE_URL}/api/v1/posts/unlike`,
  ADD_COMMENT: `${API_BASE_URL}/api/v1/posts/comment`,
  GET_COMMENTS: (postId: string, mediaId: string) => `${API_BASE_URL}/api/v1/posts/comments/${postId}/${mediaId}`,
  GET_LIKES_COUNT: (postId: string, mediaId: string) => `${API_BASE_URL}/api/v1/posts/likes/${postId}/${mediaId}`,
  SUGGESTED_USERS: `${API_BASE_URL}/api/v1/posts/suggested-users`,
  USER_ACTIVITY: `${API_BASE_URL}/api/v1/posts/user-activity`,
  // Chat endpoints
  CHAT_ROOM: (userId: string) => `${API_BASE_URL}/api/v1/chat/room/${userId}`,
  CHAT_ROOMS: `${API_BASE_URL}/api/v1/chat/rooms`,
  CHAT_MESSAGES: (chatId: string) => `${API_BASE_URL}/api/v1/chat/messages/${chatId}`,
  CHAT_MESSAGE: `${API_BASE_URL}/api/v1/chat/message`,
  MARK_MESSAGES_READ: (chatId: string) => `${API_BASE_URL}/api/v1/chat/read/${chatId}`,
  USER_SEARCH: (query: string) => `${API_BASE_URL}/api/v1/users/search?query=${query}`,
  // Chatbot endpoints
  CHATBOT_MESSAGE: `${API_BASE_URL}/api/v1/chatbot/message`,
  CHATBOT_ROOM: `${API_BASE_URL}/api/v1/chatbot/room`,
  CHATBOT_MESSAGES: `${API_BASE_URL}/api/v1/chatbot/messages`,
  // Create endpoints
  CREATE_MEDIA: `${API_BASE_URL}/api/v1/create`,
  // Notification endpoints
  NOTIFICATIONS: `${API_BASE_URL}/api/v1/notifications`,
  NOTIFICATION_READ: (id: string) => `${API_BASE_URL}/api/v1/notifications/${id}/read`,
  NOTIFICATION_DELETE: (id: string) => `${API_BASE_URL}/api/v1/notifications/${id}`,
  NOTIFICATION_MARK_ALL_READ: `${API_BASE_URL}/api/v1/notifications/mark-all-read`,
  NOTIFICATION_UNREAD_COUNT: `${API_BASE_URL}/api/v1/notifications/unread-count`,
};

// Helper function for making authenticated requests
export interface AuthenticatedRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

export const makeAuthenticatedRequest = async (
  url: string,
  options: AuthenticatedRequestOptions = {}
): Promise<Response> => {
  // Get access token from localStorage as fallback
  const accessToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
  
  const defaultOptions: AuthenticatedRequestOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      // Include Authorization header if we have a token in localStorage
      ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
      ...(options.headers || {}),
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    
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
              ...defaultOptions,
              headers: {
                ...defaultOptions.headers,
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
      }
    }
    
    return response;
  } catch (error) {
    console.error('💥 Authenticated fetch error:', error);
    throw error;
  }
};
