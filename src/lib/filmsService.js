import { API_ENDPOINTS, makeAuthenticatedRequest } from './api';

export const filmsService = {
  // Get all films (for films feed)
  async getAllFilms(page = 1, limit = 10) {
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
      return {
        success: false,
        error: error.message,
        films: [],
      };
    }
  },

  // Get user-specific films
  async getUserFilms(userId, page = 1, limit = 20) {
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
      return {
        success: false,
        error: error.message,
        films: [],
      };
    }
  },

  // Like a film
  async likeFilm(filmId, postId) {
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
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Unlike a film
  async unlikeFilm(filmId, postId) {
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
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get film comments
  async getFilmComments(filmId, postId, page = 1, limit = 20) {
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
      return {
        success: false,
        error: error.message,
        comments: [],
      };
    }
  },

  // Add comment to film
  async addComment(filmId, postId, text) {
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
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Upload new film
  async uploadFilm(file, caption = '', hashtags = []) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      if (caption.trim()) {
        formData.append('caption', caption.trim());
      }

      if (hashtags.length > 0) {
        formData.append('hashtags', JSON.stringify(hashtags));
      }

      const response = await fetch('http://localhost:5000/api/v1/create', {
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
      return {
        success: false,
        error: error.message,
      };
    }
  },

  // Get trending films
  async getTrendingFilms(limit = 20) {
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
      return {
        success: false,
        error: error.message,
        films: [],
      };
    }
  },

  // Search films
  async searchFilms(query, page = 1, limit = 20) {
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
      return {
        success: false,
        error: error.message,
        films: [],
      };
    }
  },

  // Get film by ID
  async getFilmById(filmId) {
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
      return {
        success: false,
        error: error.message,
        film: null,
      };
    }
  },

  // Report film
  async reportFilm(filmId, reason) {
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
      return {
        success: false,
        error: error.message,
      };
    }
  },
};

export default filmsService;
