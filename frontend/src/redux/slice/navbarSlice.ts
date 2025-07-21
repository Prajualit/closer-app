import { createSlice } from "@reduxjs/toolkit";
import { logNavChange } from "@/lib/navigationUtils";

interface NavHistoryItem {
  section: string;
  timestamp: number;
  from?: string | null;
}

interface NavbarState {
  activeNav: string;
  previousNav: string | null;
  navHistory: NavHistoryItem[];
}

const initialState: NavbarState = {
  activeNav: "home",
  previousNav: null,
  navHistory: [],
};

// Migration function to handle persisted state that might not have navHistory
const migrateState = (persistedState: Partial<NavbarState> | undefined): NavbarState => {
  if (!persistedState) return initialState;
  return {
    ...initialState,
    ...persistedState,
    navHistory: Array.isArray(persistedState.navHistory) ? persistedState.navHistory as NavHistoryItem[] : [],
  };
};

const navbarSlice = createSlice({
  name: "navbar",
  initialState,
  reducers: {
    setActiveNav: (state: NavbarState, action: { payload: string }) => {
      const newNav = action.payload;
      if (state.activeNav !== newNav) {
        if (process.env.NODE_ENV === 'development') {
          logNavChange(state.activeNav, newNav, 'setActiveNav');
        }
        state.previousNav = state.activeNav;
        state.activeNav = newNav;
        if (!Array.isArray(state.navHistory)) {
          state.navHistory = [];
        }
        state.navHistory.push({
          section: newNav,
          timestamp: Date.now(),
          from: state.previousNav,
        });
        if (state.navHistory.length > 50) {
          state.navHistory = state.navHistory.slice(-50);
        }
      }
    },
    resetNav: (state: NavbarState) => {
      if (process.env.NODE_ENV === 'development') {
        logNavChange(state.activeNav, 'home', 'resetNav');
      }
      state.activeNav = "home";
      state.previousNav = null;
      state.navHistory = [];
    },
    goToPreviousNav: (state: NavbarState) => {
      if (state.previousNav) {
        if (process.env.NODE_ENV === 'development') {
          logNavChange(state.activeNav, state.previousNav, 'goToPreviousNav');
        }
        const temp = state.activeNav;
        state.activeNav = state.previousNav;
        state.previousNav = temp;
        if (!Array.isArray(state.navHistory)) {
          state.navHistory = [];
        }
        state.navHistory.push({
          section: state.activeNav,
          timestamp: Date.now(),
          from: temp,
        });
      }
    },
    clearNavHistory: (state: NavbarState) => {
      state.navHistory = [];
    },
    initializeNavState: (state: NavbarState) => {
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