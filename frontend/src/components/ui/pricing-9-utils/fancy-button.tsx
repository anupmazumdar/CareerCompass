"use client";

import * as React from "react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FancyButtonProps extends ButtonProps {
  children: React.ReactNode;
}

export const FancyButton = React.forwardRef<HTMLButtonElement, FancyButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 px-6 py-3 font-semibold text-white shadow-md shadow-indigo-500/25 transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:shadow-indigo-500/35 active:scale-[0.99]",
          className
        )}
        {...props}
      >
        {children}
      </Button>
    );
  }
);
FancyButton.displayName = "FancyButton";

export default FancyButton;
