// src/components/ui/visually-hidden.tsx
import * as React from "react";
import { cn } from "@/lib/utils";

// ✅ 直接用 React.HTMLAttributes<HTMLSpanElement>，去掉多余的接口
export function VisuallyHidden({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        "clip: rect(0, 0, 0, 0)",
        className
      )}
      {...props}
    />
  );
}