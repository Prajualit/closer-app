import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
// Notification and state types
export interface Notification {
  _id: string;
  type: string;
  sender: {
    _id: string;
    name: string;
    username: string;
    avatarUrl?: string;
  };
  data?: {
    postId?: string;
    chatId?: string | { chatId: string };
  };
  message: string;
  createdAt: string;
  read: boolean;
  readAt?: string;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    total: number;
    count: number;
    unreadCount?: number;
  };
  lastFetch: number | null;
}
import { API_ENDPOINTS, makeAuthenticatedRequest } from '@/lib/api';

// Async thunks for API calls
export const fetchNotifications = createAsyncThunk<
  { notifications: Notification[]; pagination: NotificationState['pagination'] },
  { page?: number; limit?: number; unreadOnly?: boolean }
>(
  'notifications/fetchNotifications',
  async ({ page = 1, limit = 20, unreadOnly = false } = {}, { rejectWithValue }) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.NOTIFICATIONS}?page=${page}&limit=${limit}&unreadOnly=${unreadOnly}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const markNotificationAsRead = createAsyncThunk<
  { notificationId: string; notification: any },
  string
>(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}/read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }
      
      const data = await response.json();
      return { notificationId, notification: data.data };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.NOTIFICATIONS}/mark-all-read`, {
        method: 'PATCH',
      });
      
      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }
      
      return true;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const deleteNotification = createAsyncThunk<
  string,
  string
>(
  'notifications/deleteNotification',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.NOTIFICATIONS}/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }
      
      return notificationId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

export const fetchUnreadCount = createAsyncThunk(
  'notifications/fetchUnreadCount',
  async (_, { rejectWithValue }) => {
    try {
      const response = await makeAuthenticatedRequest(`${API_ENDPOINTS.NOTIFICATIONS}/unread-count`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch unread count');
      }
      
      const data = await response.json();
      return data.data.unreadCount;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : String(error));
    }
  }
);

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  pagination: {
    current: 1,
    total: 1,
    count: 0,
  },
  lastFetch: null,
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addNewNotification: (state, action: PayloadAction<Notification>) => {
      // Add new notification to the beginning of the list
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    incrementUnreadCount: (state) => {
      state.unreadCount += 1;
    },
    resetNotifications: (state) => {
      return initialState;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<{ notifications: Notification[]; pagination: NotificationState['pagination'] }>) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.pagination = action.payload.pagination;
        state.unreadCount = action.payload.pagination.unreadCount ?? 0;
        state.lastFetch = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action: PayloadAction<unknown>) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 'Unknown error';
      })
      
      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<{ notificationId: string; notification: Notification }>) => {
        const { notificationId } = action.payload;
        const notification = state.notifications.find(n => n._id === notificationId);
        if (notification && !notification.read) {
          notification.read = true;
          notification.readAt = new Date().toISOString();
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      // Mark all as read
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications.forEach((notification) => {
          if (!notification.read) {
            notification.read = true;
            notification.readAt = new Date().toISOString();
          }
        });
        state.unreadCount = 0;
      })
      
      // Delete notification
      .addCase(deleteNotification.fulfilled, (state, action: PayloadAction<string>) => {
        const notificationId = action.payload;
        const notificationIndex = state.notifications.findIndex(n => n._id === notificationId);
        if (notificationIndex !== -1) {
          const notification = state.notifications[notificationIndex];
          if (notification && !notification.read) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
          state.notifications.splice(notificationIndex, 1);
          state.pagination.count -= 1;
        }
      })
      
      // Fetch unread count
      .addCase(fetchUnreadCount.fulfilled, (state, action: PayloadAction<number>) => {
        state.unreadCount = action.payload;
      });
  },
});

export const { 
  clearError, 
  addNewNotification, 
  incrementUnreadCount, 
  resetNotifications 
} = notificationSlice.actions;

export default notificationSlice.reducer;
