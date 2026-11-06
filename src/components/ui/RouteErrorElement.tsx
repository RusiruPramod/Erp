import React from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { AlertCircle, RotateCcw, Home } from 'lucide-react';
import { Button } from './Button';

export const RouteErrorElement: React.FC = () => {
  const error = useRouteError() as any;
  const navigate = useNavigate();

  const isChunkError =
    error?.message?.includes('Failed to fetch dynamically imported module') ||
    error?.message?.includes('Importing a module script failed');

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-neutral-50 p-6 text-center">
      <div className="max-w-md w-full bg-white rounded-2xl border border-neutral-200/90 p-8 shadow-xs space-y-4">
        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-200 text-[#FF8C00] flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-neutral-900">
          {isChunkError ? 'Update Available' : 'Something went wrong'}
        </h2>
        <p className="text-xs text-neutral-500 leading-relaxed">
          {isChunkError
            ? 'The application was updated. Please reload the page to load the fresh components.'
            : (error?.message || 'An unexpected application error occurred.')}
        </p>
        <div className="flex items-center justify-center gap-2 pt-2">
          <Button
            variant="primary"
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => window.location.reload()}
          >
            Reload Page
          </Button>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Home className="w-3.5 h-3.5" />}
            onClick={() => navigate('/dashboard')}
          >
            Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

