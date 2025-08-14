// Utility to ensure all media URLs are HTTPS
export const ensureHttpsUrl = (url: string): string => {
  if (!url) return url;
  
  // Convert Cloudinary HTTP URLs to HTTPS
  if (url.includes('res.cloudinary.com') && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  // For any other HTTP URLs in production, convert to HTTPS
  if (process.env.NODE_ENV === 'production' && url.startsWith('http://')) {
    return url.replace('http://', 'https://');
  }
  
  return url;
};

// Helper to batch convert URLs in media arrays
export const secureMediaUrls = (mediaArray: any[]): any[] => {
  return mediaArray.map(item => ({
    ...item,
    url: ensureHttpsUrl(item.url),
    ...(item.avatarUrl && { avatarUrl: ensureHttpsUrl(item.avatarUrl) })
  }));
};

// Use this in components where you display media
// Example:
// const securePhotos = secureMediaUrls(photos);
// const secureFilms = secureMediaUrls(films);
