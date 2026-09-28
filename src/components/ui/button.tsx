/* eslint-disable react-refresh/only-export-components */
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary",
        primary:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary",
        secondary:
          "border border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary focus-visible:ring-primary",
        outline:
          "border border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary focus-visible:ring-primary",
        ghost:
          "text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring",
        violet:
          "bg-brand-violet text-brand-violet-foreground shadow-sm hover:bg-brand-violet/90 focus-visible:ring-brand-violet",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-4",
        sm: "h-9 px-3",
        lg: "h-12 px-6",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { Button, buttonVariants };
