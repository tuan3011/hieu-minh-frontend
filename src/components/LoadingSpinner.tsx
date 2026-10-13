import React from 'react';

interface LoadingSpinnerProps {
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ message = 'Đang tải...' }) => {
  return (
    <div className="spinner-container" role="status" aria-live="polite">
      <div className="spinner-circle"></div>
      <p className="spinner-text">{message}</p>
    </div>
  );
};
