import { createSlice } from "@reduxjs/toolkit";

interface User {
  [key: string]: any;
  media?: any[];
}

interface UserState {
  user: User | null;
}

const initialState: UserState = {
  user: null,
};

export const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state: UserState, action: { payload: User }) => {
      state.user = action.payload;
    },
    updateUser: (state: UserState, action: { payload: Partial<User> & { media?: any } }) => {
      if (!state.user) return;
      if (action.payload.media) {
        if (!Array.isArray(state.user.media)) {
          state.user.media = [];
        }
        state.user.media.push(action.payload.media);
      }
      state.user = {
        ...state.user,
        ...action.payload,
      };
    },
    logout: (state: UserState) => {
      state.user = null;
    },
  },
});

export const { setUser, updateUser, logout } = userSlice.actions;

