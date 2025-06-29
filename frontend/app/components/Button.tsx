/// <reference lib="dom" />
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<any> & {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
};

const Button: React.FC<ButtonProps> = ({
  children,
  className = "",
  variant = "primary",
  size = "md",
  ...props
}) => {
  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-lg",
  };

  const variantClasses = {
    primary: "bg-[var(--primary)] hover:bg-[var(--primary-dark)] text-white hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-none",
    secondary: "bg-[var(--card)] hover:bg-[var(--background)] text-[var(--foreground)] border border-[var(--card-border)] hover:border-[var(--primary)]",
    danger: "bg-red-400 hover:bg-red-500 text-white",
  };

  return (
    <button
      className={`flex flex-row items-center rounded-lg ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
