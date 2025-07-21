"use client";
import { Provider } from "react-redux";
import { store, persistor } from "@/redux/Store";
import { PersistGate } from "redux-persist/integration/react";

import type { ReactNode } from "react";

interface ReduxProviderProps {
  children: ReactNode;
}

export default function ReduxProvider({ children }: ReduxProviderProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
