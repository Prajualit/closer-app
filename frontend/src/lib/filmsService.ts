import { API_ENDPOINTS, makeAuthenticatedRequest } from './api';

export const filmsService = {
  // Get all films (for films feed)
  async getAllFilms(page: number = 1, limit: number = 10): Promise<{ success: boolean; films: any[]; pagination?: any; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.POSTS}?page=${page}&limit=${limit}&type=video`,
        {
          method: 'GET',
        }
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          films: data.data?.posts || [],
          pagination: data.data?.pagination || {},
        };
      } else {
        throw new Error('Failed to fetch films');
      }
    } catch (error) {
      console.error('Error fetching films:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
        films: [],
      };
    }
  },

  // Get user-specific films
  async getUserFilms(userId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; films: any[]; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.USER_FILMS(userId)}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
        }
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          films: data.data?.films || [],
        };
      } else {
        throw new Error('Failed to fetch user films');
      }
    } catch (error) {
      console.error('Error fetching user films:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
        films: [],
      };
    }
  },

  // Like a film
  async likeFilm(filmId: string, postId: string): Promise<{ success: boolean; likesCount?: number; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(API_ENDPOINTS.LIKE_POST, {
        method: 'POST',
        body: JSON.stringify({
          postId: postId,
          mediaId: filmId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          likesCount: data.data?.likesCount || 0,
        };
      } else {
        throw new Error('Failed to like film');
      }
    } catch (error) {
      console.error('Error liking film:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
      };
    }
  },

  // Unlike a film
  async unlikeFilm(filmId: string, postId: string): Promise<{ success: boolean; likesCount?: number; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(API_ENDPOINTS.UNLIKE_POST, {
        method: 'POST',
        body: JSON.stringify({
          postId: postId,
          mediaId: filmId,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          likesCount: data.data?.likesCount || 0,
        };
      } else {
        throw new Error('Failed to unlike film');
      }
    } catch (error) {
      console.error('Error unliking film:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
      };
    }
  },

  // Get film comments
  async getFilmComments(filmId: string, postId: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; comments: any[]; total?: number; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.GET_COMMENTS(postId, filmId)}?page=${page}&limit=${limit}`,
        {
          method: 'GET',
        }
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          comments: data.data?.comments || [],
          total: data.data?.total || 0,
        };
      } else {
        throw new Error('Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
        comments: [],
      };
    }
  },

  // Add comment to film
  async addComment(filmId: string, postId: string, text: string): Promise<{ success: boolean; comment?: any; commentsCount?: number; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(API_ENDPOINTS.ADD_COMMENT, {
        method: 'POST',
        body: JSON.stringify({
          postId: postId,
          mediaId: filmId,
          text: text.trim(),
        }),
      });
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          comment: data.data?.comment,
          commentsCount: data.data?.commentsCount || 0,
        };
      } else {
        throw new Error('Failed to add comment');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
      };
    }
  },

  // Upload new film
  async uploadFilm(file: File, caption: string = '', hashtags: string[] = []): Promise<{ success: boolean; media?: any; user?: any; error?: string }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }
      if (hashtags.length > 0) {
        formData.append('hashtags', JSON.stringify(hashtags));
      }
      const response = await fetch(API_ENDPOINTS.CREATE_MEDIA, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          media: data.data?.media,
          user: data.data?.user,
        };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading film:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
      };
    }
  },

  // Get trending films
  async getTrendingFilms(limit: number = 20): Promise<{ success: boolean; films: any[]; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.POSTS}?page=1&limit=${limit}&type=video&sort=trending`,
        {
          method: 'GET',
        }
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          films: data.data?.posts || [],
        };
      } else {
        throw new Error('Failed to fetch trending films');
      }
    } catch (error) {
      console.error('Error fetching trending films:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
        films: [],
      };
    }
  },

  // Search films
  async searchFilms(query: string, page: number = 1, limit: number = 20): Promise<{ success: boolean; films: any[]; total?: number; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.POSTS}?page=${page}&limit=${limit}&type=video&search=${encodeURIComponent(query)}`,
        {
          method: 'GET',
        }
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          films: data.data?.posts || [],
          total: data.data?.total || 0,
        };
      } else {
        throw new Error('Failed to search films');
      }
    } catch (error) {
      console.error('Error searching films:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
        films: [],
      };
    }
  },

  // Get film by ID
  async getFilmById(filmId: string): Promise<{ success: boolean; film?: any; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_ENDPOINTS.POSTS}?filmId=${filmId}`,
        {
          method: 'GET',
        }
      );
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          film: data.data?.film,
        };
      } else {
        throw new Error('Film not found');
      }
    } catch (error) {
      console.error('Error fetching film:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
        film: null,
      };
    }
  },

  // Report film
  async reportFilm(filmId: string, reason: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await makeAuthenticatedRequest('/api/v1/report', {
        method: 'POST',
        body: JSON.stringify({
          type: 'film',
          itemId: filmId,
          reason: reason,
        }),
      });
      if (response.ok) {
        return {
          success: true,
          message: 'Film reported successfully',
        };
      } else {
        throw new Error('Failed to report film');
      }
    } catch (error) {
      console.error('Error reporting film:', error);
      let message = 'Unknown error';
      if (error instanceof Error) message = error.message;
      return {
        success: false,
        error: message,
      };
    }
  },
};

export default filmsService;
