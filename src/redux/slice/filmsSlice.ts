import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import filmsService from '@/lib/filmsService';

// Async thunks
interface FetchFilmsArgs {
  page?: number;
  limit?: number;
}
export const fetchFilms = createAsyncThunk(
  'films/fetchFilms',
  async ({ page = 1, limit = 10 }: FetchFilmsArgs = {}, { rejectWithValue }) => {
    try {
      const result = await filmsService.getAllFilms(page, limit);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface FetchUserFilmsArgs {
  userId: string;
  page?: number;
  limit?: number;
}
export const fetchUserFilms = createAsyncThunk(
  'films/fetchUserFilms',
  async ({ userId, page = 1, limit = 20 }: FetchUserFilmsArgs, { rejectWithValue }) => {
    try {
      const result = await filmsService.getUserFilms(userId, page, limit);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchTrendingFilms = createAsyncThunk(
  'films/fetchTrendingFilms',
  async (limit: number = 20, { rejectWithValue }) => {
    try {
      const result = await filmsService.getTrendingFilms(limit);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface LikeFilmArgs {
  filmId: string;
  postId: string;
  isLiked: boolean;
}
export const likeFilm = createAsyncThunk(
  'films/likeFilm',
  async ({ filmId, postId, isLiked }: LikeFilmArgs, { rejectWithValue }) => {
    try {
      const result = isLiked 
        ? await filmsService.unlikeFilm(filmId, postId)
        : await filmsService.likeFilm(filmId, postId);
      
      if (result.success) {
        return { filmId, isLiked: !isLiked, likesCount: result.likesCount };
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface UploadFilmArgs {
  file: File;
  caption?: string;
  hashtags?: string[];
}
export const uploadFilm = createAsyncThunk(
  'films/uploadFilm',
  async ({ file, caption, hashtags }: UploadFilmArgs, { rejectWithValue }) => {
    try {
      const result = await filmsService.uploadFilm(file, caption, hashtags);
      if (result.success) {
        return result;
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  }
);

interface Film {
  _id: string;
  isLikedByCurrentUser?: boolean;
  likesCount?: number;
  commentsCount?: number;
  [key: string]: any;
}

interface FilmsState {
  films: Film[];
  currentFilmIndex: number;
  userFilms: { [userId: string]: Film[] };
  trendingFilms: Film[];
  loading: boolean;
  loadingMore: boolean;
  uploading: boolean;
  hasMore: boolean;
  page: number;
  error: string | null;
  uploadError: string | null;
  isPlaying: boolean;
  isMuted: boolean;
  showComments: boolean;
  lastFetchTime: number | null;
  cacheExpiry: number;
}

const initialState: FilmsState = {
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

export const filmsSlice = createSlice({
  name: 'films',
  initialState,
  reducers: {
    // Navigation
    setCurrentFilmIndex: (state: FilmsState, action: { payload: number }) => {
      state.currentFilmIndex = action.payload;
    },
    nextFilm: (state: FilmsState) => {
      if (state.currentFilmIndex < state.films.length - 1) {
        state.currentFilmIndex += 1;
      }
    },
    previousFilm: (state: FilmsState) => {
      if (state.currentFilmIndex > 0) {
        state.currentFilmIndex -= 1;
      }
    },
    setIsPlaying: (state: FilmsState, action: { payload: boolean }) => {
      state.isPlaying = action.payload;
    },
    setIsMuted: (state: FilmsState, action: { payload: boolean }) => {
      state.isMuted = action.payload;
    },
    toggleMute: (state: FilmsState) => {
      state.isMuted = !state.isMuted;
    },
    setShowComments: (state: FilmsState, action: { payload: boolean }) => {
      state.showComments = action.payload;
    },
    updateFilmLike: (state: FilmsState, action: { payload: { filmId: string; isLiked: boolean; likesCount: number } }) => {
      const { filmId, isLiked, likesCount } = action.payload;
      const filmIndex = state.films.findIndex(film => film._id === filmId);
      if (filmIndex !== -1) {
        state.films[filmIndex].isLikedByCurrentUser = isLiked;
        state.films[filmIndex].likesCount = likesCount;
      }
    },
    updateFilmComments: (state: FilmsState, action: { payload: { filmId: string; commentsCount: number } }) => {
      const { filmId, commentsCount } = action.payload;
      const filmIndex = state.films.findIndex(film => film._id === filmId);
      if (filmIndex !== -1) {
        state.films[filmIndex].commentsCount = commentsCount;
      }
    },
    resetFilms: (state: FilmsState) => {
      state.films = [];
      state.currentFilmIndex = 0;
      state.page = 1;
      state.hasMore = true;
      state.error = null;
    },
    resetUserFilms: (state: FilmsState, action: { payload?: string }) => {
      const userId = action.payload;
      if (userId) {
        delete state.userFilms[userId];
      } else {
        state.userFilms = {};
      }
    },
    clearErrors: (state: FilmsState) => {
      state.error = null;
      state.uploadError = null;
    },
    invalidateCache: (state: FilmsState) => {
      state.lastFetchTime = null;
    },
  },
  
  extraReducers: (builder) => {
    builder
      // Fetch films
      .addCase(fetchFilms.pending, (state, action) => {
        const isLoadMore = ((action.meta.arg && typeof action.meta.arg.page === 'number') ? action.meta.arg.page : 1) > 1;
        if (isLoadMore) {
          state.loadingMore = true;
        } else {
          state.loading = true;
          state.error = null;
        }
      })
      .addCase(fetchFilms.fulfilled, (state, action) => {
        const { films, pagination } = action.payload;
        const isLoadMore = ((action.meta.arg && typeof action.meta.arg.page === 'number') ? action.meta.arg.page : 1) > 1;
        
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
        state.error = action.payload as string;
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
        state.uploadError = action.payload as string;
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
import { RootState } from '@/redux/Store';

function getFilmsState(state: RootState): FilmsState {
  // @ts-ignore
  const films = (state.films as any);
  if (
    films &&
    typeof films === 'object' &&
    Object.prototype.hasOwnProperty.call(films, 'films') &&
    Object.prototype.hasOwnProperty.call(films, 'currentFilmIndex') &&
    Object.prototype.hasOwnProperty.call(films, 'userFilms') &&
    Object.prototype.hasOwnProperty.call(films, 'trendingFilms')
  ) {
    return films as FilmsState;
  }
  return initialState;
}

export const selectFilms = (state: RootState) => getFilmsState(state).films;
export const selectCurrentFilm = (state: RootState) => getFilmsState(state).films[getFilmsState(state).currentFilmIndex];
export const selectCurrentFilmIndex = (state: RootState) => getFilmsState(state).currentFilmIndex;
export const selectUserFilms = (userId: string) => (state: RootState) => getFilmsState(state).userFilms[userId] || [];
export const selectTrendingFilms = (state: RootState) => getFilmsState(state).trendingFilms;
export const selectFilmsLoading = (state: RootState) => getFilmsState(state).loading;
export const selectFilmsLoadingMore = (state: RootState) => getFilmsState(state).loadingMore;
export const selectFilmsUploading = (state: RootState) => getFilmsState(state).uploading;
export const selectFilmsError = (state: RootState) => getFilmsState(state).error;
export const selectFilmsUploadError = (state: RootState) => getFilmsState(state).uploadError;
export const selectFilmsHasMore = (state: RootState) => getFilmsState(state).hasMore;
export const selectFilmsPage = (state: RootState) => getFilmsState(state).page;
export const selectIsPlaying = (state: RootState) => getFilmsState(state).isPlaying;
export const selectIsMuted = (state: RootState) => getFilmsState(state).isMuted;
export const selectShowComments = (state: RootState) => getFilmsState(state).showComments;

export default filmsSlice.reducer;
