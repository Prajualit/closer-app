import { createSlice } from "@reduxjs/toolkit";

const userSlice = createSlice({
  name: "user",
  initialState: {
    user: "home",
  },
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    updateUser(state, action) {
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
  },
});

export const { setUser, logout, updateUser } = userSlice.actions;
export default userSlice.reducer;
