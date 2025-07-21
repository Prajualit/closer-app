import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import { userSlice } from "./slice/userSlice";
const userReducer = userSlice.reducer;
import navReducer, { migrateState } from "./slice/navbarSlice";
import notificationReducer from "./slice/notificationSlice";
import filmsReducer from "./slice/filmsSlice";

const persistConfig = {
  key: "root",
  storage,
  version: 1, // Add version for migration
  // Only persist user and navbar data, not notifications or films (they should be fresh)
  whitelist: ['user', 'navbar'],
  migrate: (state: any) => {
    // Handle navbar state migration
    if (state && state.navbar) {
      state.navbar = migrateState(state.navbar);
    }
    return Promise.resolve(state);
  },
};

const rootReducer = combineReducers({
  user: userReducer,
  navbar: navReducer,
  notifications: notificationReducer,
  films: filmsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);


export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }), // thunk is included by default here
});

// (Removed duplicate RootState and persistor exports)

export type RootState = ReturnType<typeof store.getState>;

export const persistor = persistStore(store);
