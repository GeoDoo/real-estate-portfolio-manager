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
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: "btn btn-primary",
    secondary: "btn btn-secondary",
    danger: "btn btn-danger",
  };

  return (
    <button
      className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
