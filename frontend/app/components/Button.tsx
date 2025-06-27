/// <reference lib="dom" />
import React from 'react';

type ButtonProps = React.ButtonHTMLAttributes<any> & {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
};

const base = 'px-4 py-2 rounded font-semibold shadow-sm transition focus:outline-none focus:ring-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed';
const variants = {
  primary: 'bg-[var(--primary)] text-white hover:bg-[#00cfa6] hover:text-white focus:ring-[var(--primary)]',
  secondary: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 hover:text-gray-900 focus:ring-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
};

const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => (
  <button
    className={`${base} ${variants[variant]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button; 