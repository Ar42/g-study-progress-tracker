import { configureStore } from "@reduxjs/toolkit";
import { studyApi } from "../services/studyApi";

export const store = configureStore({
  reducer: {
    [studyApi.reducerPath]: studyApi.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(studyApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
