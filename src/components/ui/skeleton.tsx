import { cn } from "@/lib/utils"


import React from "react";
import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
);
Skeleton.displayName = "Skeleton";

export { Skeleton }
