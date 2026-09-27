import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "violet";
  size?: "default" | "icon";
};

const variants = {
  primary:
    "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:ring-primary",
  secondary:
    "border border-border bg-card text-foreground hover:border-primary/30 hover:bg-secondary focus-visible:ring-primary",
  ghost: "text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:ring-ring",
  violet:
    "bg-brand-violet text-brand-violet-foreground shadow-sm hover:bg-brand-violet/90 focus-visible:ring-brand-violet",
};

export function Button({
  className = "",
  variant = "primary",
  size = "default",
  type = "button",
  ...props
}: ButtonProps) {
  const sizeClass = size === "icon" ? "h-10 w-10 p-0" : "h-11 px-4";

  return (
    <button
      type={type}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${sizeClass} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}