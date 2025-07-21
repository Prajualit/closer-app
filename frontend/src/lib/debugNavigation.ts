/**
 * Utility functions for handling navigation state issues
 */

/**
 * Clear persisted Redux state - useful for debugging or when state gets corrupted
 * This will reset all persisted state to initial values
 */
export const clearPersistedState = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('persist:root');
      console.log('Persisted state cleared. Please refresh the page.');
      return true;
    } catch (error) {
      console.error('Failed to clear persisted state:', error);
      return false;
    }
  }
  return false;
};

/**
 * Check if the current persisted state has the navHistory property
 */
export const checkPersistedState = () => {
  if (typeof window !== 'undefined') {
    try {
      const persistedState = localStorage.getItem('persist:root');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        const navbar = JSON.parse(parsed.navbar || '{}');
        console.log('Current navbar state:', navbar);
        return {
          hasNavHistory: Array.isArray(navbar.navHistory),
          navbarState: navbar,
        };
      }
    } catch (error) {
      console.error('Failed to check persisted state:', error);
    }
  }
  return { hasNavHistory: false, navbarState: null };
};

/**
 * Migration utility to fix existing persisted state
 */
export const fixPersistedNavState = () => {
  if (typeof window !== 'undefined') {
    try {
      const persistedState = localStorage.getItem('persist:root');
      if (persistedState) {
        const parsed = JSON.parse(persistedState);
        let navbar = JSON.parse(parsed.navbar || '{}');
        
        // Fix the navbar state
        navbar = {
          activeNav: navbar.activeNav || 'home',
          previousNav: navbar.previousNav || null,
          navHistory: Array.isArray(navbar.navHistory) ? navbar.navHistory : [],
        };
        
        // Save back to localStorage
        parsed.navbar = JSON.stringify(navbar);
        localStorage.setItem('persist:root', JSON.stringify(parsed));
        
        console.log('Fixed persisted navigation state:', navbar);
        return true;
      }
    } catch (error) {
      console.error('Failed to fix persisted state:', error);
    }
  }
  return false;
};
