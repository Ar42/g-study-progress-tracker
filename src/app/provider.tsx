import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { store } from "./store";

interface ReduxProviderProps {
  readonly children: ReactNode;
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ children }) => {
  return <Provider store={store}>{children}</Provider>;
};
ReduxProvider.displayName = "ReduxProvider";
