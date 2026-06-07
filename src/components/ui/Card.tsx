import * as React from "react";
import { clsx } from "clsx";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, interactive = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={clsx(
          "glass-panel rounded-xl p-5 overflow-hidden",
          interactive && "glass-panel-interactive cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";
