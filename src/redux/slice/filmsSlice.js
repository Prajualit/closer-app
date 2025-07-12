import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import filmsService from '@/lib/filmsService';

// Async thunks
export const fetchFilms = createAsyncThunk(
  'films/fetchFilms',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const result = await filmsService.getAllFilms(page, limit);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchUserFilms = createAsyncThunk(
  'films/fetchUserFilms',
  async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const result = await filmsService.getUserFilms(userId, page, limit);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTrendingFilms = createAsyncThunk(
  'films/fetchTrendingFilms',
  async (limit = 20, { rejectWithValue }) => {
    try {
      const result = await filmsService.getTrendingFilms(limit);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const likeFilm = createAsyncThunk(
  'films/likeFilm',
  async ({ filmId, postId, isLiked }, { rejectWithValue }) => {
    try {
      const result = isLiked 
        ? await filmsService.unlikeFilm(filmId, postId)
        : await filmsService.likeFilm(filmId, postId);
      
      if (result.success) {
        return { filmId, isLiked: !isLiked, likesCount: result.likesCount };
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const uploadFilm = createAsyncThunk(
  'films/uploadFilm',
  async ({ file, caption, hashtags }, { rejectWithValue }) => {
    try {
      const result = await filmsService.uploadFilm(file, caption, hashtags);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // Films feed
  films: [],
  currentFilmIndex: 0,
  
  // User films
  userFilms: {},
  
  // Trending films
  trendingFilms: [],
  
  // Loading states
  loading: false,
  loadingMore: false,
  uploading: false,
  
  // Pagination
  hasMore: true,
  page: 1,
  
  // Error states
  error: null,
  uploadError: null,
  
  // UI states
  isPlaying: false,
  isMuted: true,
  showComments: false,
  
  // Cache
  lastFetchTime: null,
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
};

const filmsSlice = createSlice({
  name: 'films',
  initialState,
  reducers: {
    // Navigation
    setCurrentFilmIndex: (state, action) => {
      state.currentFilmIndex = action.payload;
    },
    
    nextFilm: (state) => {
      if (state.currentFilmIndex < state.films.length - 1) {
        state.currentFilmIndex += 1;
      }
    },
    
    previousFilm: (state) => {
      if (state.currentFilmIndex > 0) {
        state.currentFilmIndex -= 1;
      }
    },
    
    // Playback controls
    setIsPlaying: (state, action) => {
      state.isPlaying = action.payload;
    },
    
    setIsMuted: (state, action) => {
      state.isMuted = action.payload;
    },
    
    toggleMute: (state) => {
      state.isMuted = !state.isMuted;
    },
    
    // UI controls
    setShowComments: (state, action) => {
      state.showComments = action.payload;
    },
    
    // Film interactions
    updateFilmLike: (state, action) => {
      const { filmId, isLiked, likesCount } = action.payload;
      const filmIndex = state.films.findIndex(film => film._id === filmId);
      if (filmIndex !== -1) {
        state.films[filmIndex].isLikedByCurrentUser = isLiked;
        state.films[filmIndex].likesCount = likesCount;
      }
    },
    
    updateFilmComments: (state, action) => {
      const { filmId, commentsCount } = action.payload;
      const filmIndex = state.films.findIndex(film => film._id === filmId);
      if (filmIndex !== -1) {
        state.films[filmIndex].commentsCount = commentsCount;
      }
    },
    
    // Reset states
    resetFilms: (state) => {
      state.films = [];
      state.currentFilmIndex = 0;
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
    
    resetUserFilms: (state, action) => {
      const userId = action.payload;
      if (userId) {
        delete state.userFilms[userId];
      } else {
        state.userFilms = {};
      }
    },
    
    clearErrors: (state) => {
      state.error = null;
      state.uploadError = null;
    },
    
    // Cache management
    invalidateCache: (state) => {
      state.lastFetchTime = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch films
      .addCase(fetchFilms.pending, (state, action) => {
        const isLoadMore = action.meta.arg?.page > 1;
        if (isLoadMore) {
          state.loadingMore = true;
        } else {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchFilms.fulfilled, (state, action) => {
        const { films, pagination } = action.payload;
        const isLoadMore = action.meta.arg?.page > 1;
        
        if (isLoadMore) {
          state.films = [...state.films, ...films];
          state.loadingMore = false;
        } else {
          state.films = films;
          state.loading = false;
          state.currentFilmIndex = 0;
        }
        
        state.hasMore = films.length === (action.meta.arg?.limit || 10);
        state.page = action.meta.arg?.page || 1;
        state.lastFetchTime = Date.now();
      })
      .addCase(fetchFilms.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload;
      })
      
      // Fetch user films
      .addCase(fetchUserFilms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserFilms.fulfilled, (state, action) => {
        const { films } = action.payload;
        const userId = action.meta.arg.userId;
        state.userFilms[userId] = films;
        state.loading = false;
      })
      .addCase(fetchUserFilms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch trending films
      .addCase(fetchTrendingFilms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrendingFilms.fulfilled, (state, action) => {
        state.trendingFilms = action.payload.films;
        state.loading = false;
      })
      .addCase(fetchTrendingFilms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Like film
      .addCase(likeFilm.fulfilled, (state, action) => {
        const { filmId, isLiked, likesCount } = action.payload;
        const filmIndex = state.films.findIndex(film => film._id === filmId);
        if (filmIndex !== -1) {
          state.films[filmIndex].isLikedByCurrentUser = isLiked;
          state.films[filmIndex].likesCount = likesCount;
        }
      })
      
      // Upload film
      .addCase(uploadFilm.pending, (state) => {
        state.uploading = true;
        state.uploadError = null;
      })
      .addCase(uploadFilm.fulfilled, (state, action) => {
        state.uploading = false;
        // Optionally add the new film to the beginning of the films array
        // if (action.payload.film) {
        //   state.films.unshift(action.payload.film);
        // }
      })
      .addCase(uploadFilm.rejected, (state, action) => {
        state.uploading = false;
        state.uploadError = action.payload;
      });
  },
});

export const {
  setCurrentFilmIndex,
  nextFilm,
  previousFilm,
  setIsPlaying,
  setIsMuted,
  toggleMute,
  setShowComments,
  updateFilmLike,
  updateFilmComments,
  resetFilms,
  resetUserFilms,
  clearErrors,
  invalidateCache,
} = filmsSlice.actions;

// Selectors
export const selectFilms = (state) => state.films.films;
export const selectCurrentFilm = (state) => state.films.films[state.films.currentFilmIndex];
export const selectCurrentFilmIndex = (state) => state.films.currentFilmIndex;
export const selectUserFilms = (userId) => (state) => state.films.userFilms[userId] || [];
export const selectTrendingFilms = (state) => state.films.trendingFilms;
export const selectFilmsLoading = (state) => state.films.loading;
export const selectFilmsLoadingMore = (state) => state.films.loadingMore;
export const selectFilmsUploading = (state) => state.films.uploading;
export const selectFilmsError = (state) => state.films.error;
export const selectFilmsUploadError = (state) => state.films.uploadError;
export const selectFilmsHasMore = (state) => state.films.hasMore;
export const selectFilmsPage = (state) => state.films.page;
export const selectIsPlaying = (state) => state.films.isPlaying;
export const selectIsMuted = (state) => state.films.isMuted;
export const selectShowComments = (state) => state.films.showComments;

export default filmsSlice.reducer;
