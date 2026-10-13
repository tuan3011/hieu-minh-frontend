import React from 'react';

interface ErrorAlertProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  title = 'Có lỗi xảy ra',
  message,
  onRetry,
}) => {
  return (
    <div className="error-alert" role="alert">
      <div className="error-icon" aria-hidden="true">⚠️</div>
      <div className="error-content">
        <h4 className="error-title">{title}</h4>
        <p className="error-message">{message}</p>
        {onRetry && (
          <button type="button" className="btn-retry" onClick={onRetry}>
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};
