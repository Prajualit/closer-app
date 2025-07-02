/**
 * Navigation utilities for debugging and monitoring
 */

/**
 * Log navigation state changes for debugging
 */
export const logNavChange = (from, to, trigger = 'unknown') => {
  if (process.env.NODE_ENV === 'development') {
    console.group(`🧭 Navigation Change`);
    console.log(`From: ${from}`);
    console.log(`To: ${to}`);
    console.log(`Trigger: ${trigger}`);
    console.log(`Time: ${new Date().toLocaleTimeString()}`);
    console.groupEnd();
  }
};

/**
 * Validate navigation keys
 */
export const isValidNavKey = (navKey, validNavs = ['home', 'films', 'chat', 'notifications', 'profile']) => {
  return validNavs.includes(navKey);
};

/**
 * Get navigation analytics data
 */
export const getNavAnalytics = (navHistory = []) => {
  if (!Array.isArray(navHistory) || navHistory.length === 0) {
    return {
      totalNavigations: 0,
      mostVisitedSection: null,
      sessionDuration: 0,
    };
  }

  const frequency = navHistory.reduce((acc, nav) => {
    acc[nav.section] = (acc[nav.section] || 0) + 1;
    return acc;
  }, {});

  const mostVisitedSection = Object.entries(frequency)
    .sort(([,a], [,b]) => b - a)[0]?.[0] || null;

  const firstNavTime = navHistory[0]?.timestamp;
  const lastNavTime = navHistory[navHistory.length - 1]?.timestamp;
  const sessionDuration = lastNavTime && firstNavTime 
    ? lastNavTime - firstNavTime 
    : 0;

  return {
    totalNavigations: navHistory.length,
    mostVisitedSection,
    sessionDuration,
    frequency,
  };
};
