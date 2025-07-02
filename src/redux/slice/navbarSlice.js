import { createSlice } from "@reduxjs/toolkit";
import { logNavChange } from "@/lib/navigationUtils";

const initialState = {
  activeNav: "home",
  previousNav: null,
  navHistory: [], // Track navigation history for analytics
};

// Migration function to handle persisted state that might not have navHistory
const migrateState = (persistedState) => {
  if (!persistedState) return initialState;
  
  return {
    ...initialState,
    ...persistedState,
    // Ensure navHistory exists as an array
    navHistory: Array.isArray(persistedState.navHistory) ? persistedState.navHistory : [],
  };
};

const navbarSlice = createSlice({
  name: "navbar",
  initialState,
  reducers: {
    setActiveNav: (state, action) => {
      const newNav = action.payload;
      // Only update if the nav is actually changing
      if (state.activeNav !== newNav) {
        // Log the navigation change in development
        if (process.env.NODE_ENV === 'development') {
          logNavChange(state.activeNav, newNav, 'setActiveNav');
        }
        
        state.previousNav = state.activeNav;
        state.activeNav = newNav;
        
        // Ensure navHistory array exists (handle redux-persist hydration)
        if (!Array.isArray(state.navHistory)) {
          state.navHistory = [];
        }
        
        // Add to navigation history
        state.navHistory.push({
          section: newNav,
          timestamp: Date.now(),
          from: state.previousNav,
        });
        
        // Keep only last 50 navigation entries to prevent memory issues
        if (state.navHistory.length > 50) {
          state.navHistory = state.navHistory.slice(-50);
        }
      }
    },
    resetNav: (state) => {
      if (process.env.NODE_ENV === 'development') {
        logNavChange(state.activeNav, 'home', 'resetNav');
      }
      state.activeNav = "home";
      state.previousNav = null;
      state.navHistory = [];
    },
    goToPreviousNav: (state) => {
      if (state.previousNav) {
        if (process.env.NODE_ENV === 'development') {
          logNavChange(state.activeNav, state.previousNav, 'goToPreviousNav');
        }
        const temp = state.activeNav;
        state.activeNav = state.previousNav;
        state.previousNav = temp;
        
        // Ensure navHistory array exists (handle redux-persist hydration)
        if (!Array.isArray(state.navHistory)) {
          state.navHistory = [];
        }
        
        // Add to navigation history
        state.navHistory.push({
          section: state.activeNav,
          timestamp: Date.now(),
          from: temp,
        });
      }
    },
    clearNavHistory: (state) => {
      // Ensure navHistory array exists before clearing
      if (!Array.isArray(state.navHistory)) {
        state.navHistory = [];
      } else {
        state.navHistory = [];
      }
    },
    initializeNavState: (state) => {
      // Initialize any missing state properties
      if (typeof state.activeNav !== 'string') {
        state.activeNav = 'home';
      }
      if (!Array.isArray(state.navHistory)) {
        state.navHistory = [];
      }
      if (state.previousNav === undefined) {
        state.previousNav = null;
      }
    },
  },
});

export const { setActiveNav, resetNav, goToPreviousNav, clearNavHistory, initializeNavState } = navbarSlice.actions;
export { migrateState };
export default navbarSlice.reducer;