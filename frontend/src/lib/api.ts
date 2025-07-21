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
  const defaultOptions: AuthenticatedRequestOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  };
  return fetch(url, defaultOptions);
};
