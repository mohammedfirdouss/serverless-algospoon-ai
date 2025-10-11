import React from 'react';
import { motion } from 'framer-motion';
import './Button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const stateClasses = [
    isLoading && 'btn-loading',
    disabled && 'btn-disabled'
  ].filter(Boolean).join(' ');

  return (
    <motion.button
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${stateClasses} ${className}`}
      disabled={disabled || isLoading}
      whileTap={{ scale: 0.95 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      {...props}
    >
      {leftIcon && (
        <span className="btn-icon btn-icon-left">
          {leftIcon}
        </span>
      )}
      
      <span className="btn-content">
        {isLoading ? (
          <motion.div
            className="btn-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            🍳
          </motion.div>
        ) : children}
      </span>

      {rightIcon && (
        <span className="btn-icon btn-icon-right">
          {rightIcon}
        </span>
      )}
    </motion.button>
  );
};