import { configureStore } from "@reduxjs/toolkit";
import { sheetApi } from "../services/sheetApi";
import { adminApi } from "../services/adminApi";

export const store = configureStore({
  reducer: {
    [sheetApi.reducerPath]: sheetApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(sheetApi.middleware, adminApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
