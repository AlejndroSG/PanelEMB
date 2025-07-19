import React from 'react';

const Loading = ({ size = 'md', text = 'Cargando...', fullScreen = false }) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'lg':
        return 'h-8 w-8';
      case 'xl':
        return 'h-12 w-12';
      default:
        return 'h-6 w-6';
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm':
        return 'text-sm';
      case 'lg':
        return 'text-lg';
      case 'xl':
        return 'text-xl';
      default:
        return 'text-base';
    }
  };

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center space-y-3">
      <div className="relative">
        <div className={`${getSizeClasses()} animate-spin rounded-full border-3 border-gray-200`}>
          <div className={`${getSizeClasses()} animate-spin rounded-full border-3 border-emb-600 border-t-transparent`}></div>
        </div>
      </div>
      {text && (
        <p className={`${getTextSize()} text-gray-600 font-medium animate-pulse`}>
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return <LoadingSpinner />;
};

// Componente para mostrar loading en botones
export const ButtonLoading = ({ isLoading, children, ...props }) => {
  return (
    <button {...props} disabled={isLoading || props.disabled}>
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
          Cargando...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Loading;
