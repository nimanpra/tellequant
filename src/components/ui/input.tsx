import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm",
        "text-neutral-50 placeholder:text-zinc-500",
        "focus-visible:outline-none focus-visible:border-[#3E5CF8]/60 focus-visible:ring-2 focus-visible:ring-[#3E5CF8]/20",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "flex min-h-20 w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-sm",
      "text-neutral-50 placeholder:text-zinc-500",
      "focus-visible:outline-none focus-visible:border-[#3E5CF8]/60 focus-visible:ring-2 focus-visible:ring-[#3E5CF8]/20",
      "disabled:cursor-not-allowed disabled:opacity-50",
      "transition-colors resize-vertical",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";
