import React from 'react';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';
type SpinnerColor = 'white' | 'black' | 'gray' | 'blue';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  color?: SpinnerColor;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md', color = 'white' }) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const colorClasses: Record<SpinnerColor, string> = {
    white: 'border-white dark:border-neutral-300',
    black: 'border-black dark:border-neutral-600',
    gray: 'border-neutral-400 dark:border-neutral-500',
    blue: 'border-blue-500 dark:border-blue-400'
  };

  return (
    <div className="flex items-center justify-center">
      <div 
        className={`${sizeClasses[size]} border-2 ${colorClasses[color]} border-t-transparent rounded-full animate-spin`}
      />
    </div>
  );
};

export default LoadingSpinner;
