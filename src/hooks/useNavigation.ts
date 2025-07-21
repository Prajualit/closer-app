import { useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import { setActiveNav, initializeNavState } from '@/redux/slice/navbarSlice';

/**
 * Custom hook for managing navigation state
 * Automatically syncs activeNav with current route
 */
// Types for Redux state
interface UserState {
  user: {
    username?: string;
    [key: string]: any;
  };
}

interface NavbarState {
  activeNav?: string;
  previousNav?: string | null;
  navHistory?: string[];
  [key: string]: any;
}

interface RootState {
  user: UserState;
  navbar: NavbarState;
  [key: string]: any;
}

export const useNavigation = () => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const userDetails = useSelector((state: RootState) => state.user.user);
  const navbarState = useSelector((state: RootState) => state.navbar);

  // Ensure navbar state is properly initialized
  const { activeNav = 'home', previousNav = null } = navbarState || {};

  // Valid navigation routes
  const validNavs: string[] = useMemo(() => ['home', 'films', 'chat', 'notifications', 'profile'], []);

  /**
   * Extract navigation key from current pathname
   */
  const getNavFromPath = useCallback((path: string) => {
    if (!path || !userDetails?.username) return 'home';

    // Handle root path
    if (path === '/') return 'home';

    // Extract the page from the pathname pattern: /[username]/[page]
    const pathParts = path.split('/');
    if (pathParts.length >= 3 && pathParts[1] === userDetails.username) {
      const currentPage = pathParts[2];
      return validNavs.includes(currentPage) ? currentPage : 'home';
    }

    // Handle profile view route: /profile/[userId]
    if (path.startsWith('/profile/')) return 'profile';

    return 'home';
  }, [userDetails?.username, validNavs]);

  /**
   * Navigate to a specific section
   */
  const navigateTo = useCallback((navKey: string) => {
    if (validNavs.includes(navKey)) {
      dispatch(setActiveNav(navKey));
    }
  }, [dispatch, validNavs]);

  /**
   * Check if a navigation item is currently active
   */
  const isActive = useCallback((navKey: string) => {
    return activeNav === navKey;
  }, [activeNav]);

  /**
   * Get the URL for a navigation item
   */
  const getNavUrl = useCallback((navKey: string) => {
    if (!userDetails?.username) return '/';
    return `/${userDetails.username}/${navKey}`;
  }, [userDetails?.username]);

  // Initialize navbar state if needed
  useEffect(() => {
    if (navbarState && !Array.isArray(navbarState.navHistory)) {
      dispatch(initializeNavState());
    }
  }, [navbarState, dispatch]);

  // Auto-sync with pathname changes
  useEffect(() => {
    // Only proceed if we have a valid navbar state
    if (!navbarState) return;

    const currentNav = getNavFromPath(pathname);
    if (currentNav !== activeNav) {
      dispatch(setActiveNav(currentNav));
    }
  }, [pathname, activeNav, dispatch, getNavFromPath, navbarState]);

  return {
    activeNav,
    previousNav,
    navigateTo,
    isActive,
    getNavUrl,
    validNavs,
  };
};