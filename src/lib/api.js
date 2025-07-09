// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

// API endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  REFRESH_TOKEN: `${API_BASE_URL}/api/v1/users/refresh-token`,
  LOGOUT: `${API_BASE_URL}/api/v1/users/logout`,
  DELETE_ACCOUNT: `${API_BASE_URL}/api/v1/users/delete-account`,
  
  // User endpoints
  USER_PROFILE: (userId) => `${API_BASE_URL}/api/v1/users/profile/${userId}`,
  USER_PHOTOS: (userId) => `${API_BASE_URL}/api/v1/users/photos/${userId}`,
  USER_FILMS: (userId) => `${API_BASE_URL}/api/v1/users/films/${userId}`,
  FOLLOW_STATUS: (userId) => `${API_BASE_URL}/api/v1/users/follow-status/${userId}`,
  FOLLOW: `${API_BASE_URL}/api/v1/users/follow`,
  UNFOLLOW: `${API_BASE_URL}/api/v1/users/unfollow`,
  
  // Posts endpoints
  POSTS: `${API_BASE_URL}/api/v1/posts`,
  LIKE_POST: `${API_BASE_URL}/api/v1/posts/like`,
  UNLIKE_POST: `${API_BASE_URL}/api/v1/posts/unlike`,
  ADD_COMMENT: `${API_BASE_URL}/api/v1/posts/comment`,
  GET_COMMENTS: (postId, mediaId) => `${API_BASE_URL}/api/v1/posts/comments/${postId}/${mediaId}`,
  SUGGESTED_USERS: `${API_BASE_URL}/api/v1/posts/suggested-users`,
  USER_ACTIVITY: `${API_BASE_URL}/api/v1/posts/user-activity`,
  
  // Chat endpoints
  CHAT_ROOM: (userId) => `${API_BASE_URL}/api/v1/chat/room/${userId}`,
  CHAT_ROOMS: `${API_BASE_URL}/api/v1/chat/rooms`,
  CHAT_MESSAGES: (chatId) => `${API_BASE_URL}/api/v1/chat/messages/${chatId}`,
  CHAT_MESSAGE: `${API_BASE_URL}/api/v1/chat/message`,
  MARK_MESSAGES_READ: (chatId) => `${API_BASE_URL}/api/v1/chat/read/${chatId}`,
  USER_SEARCH: (query) => `${API_BASE_URL}/api/v1/users/search?query=${query}`,
  
  // Create endpoints
  CREATE_MEDIA: `${API_BASE_URL}/api/v1/create`,
  
  // Notification endpoints
  NOTIFICATIONS: `${API_BASE_URL}/api/v1/notifications`,
  NOTIFICATION_READ: (id) => `${API_BASE_URL}/api/v1/notifications/${id}/read`,
  NOTIFICATION_DELETE: (id) => `${API_BASE_URL}/api/v1/notifications/${id}`,
  NOTIFICATION_MARK_ALL_READ: `${API_BASE_URL}/api/v1/notifications/mark-all-read`,
  NOTIFICATION_UNREAD_COUNT: `${API_BASE_URL}/api/v1/notifications/unread-count`,
};

// Helper function for making authenticated requests
export const makeAuthenticatedRequest = async (url, options = {}) => {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };
  
  return fetch(url, defaultOptions);
};
