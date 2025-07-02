import { configureStore, combineReducers } from "@reduxjs/toolkit";
import { persistStore, persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage"; // defaults to localStorage for web
import userReducer from "./slice/userSlice";
import navReducer, { migrateState } from "./slice/navbarSlice";

const persistConfig = {
  key: "root",
  storage,
  version: 1, // Add version for migration
  migrate: (state) => {
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
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }), // thunk is included by default here
});

export const persistor = persistStore(store);
