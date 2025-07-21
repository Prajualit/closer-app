"use client";
import { Provider } from "react-redux";
import { store, persistor } from "@/redux/Store.js";
import { PersistGate } from "redux-persist/integration/react";

export default function ReduxProvider({ children }) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
