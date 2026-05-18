import { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function UnauthorizedPage(): ReactElement {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
        Access Denied
      </h1>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-md">
        You do not have permission to access this page. Please contact your administrator
        if you believe this is an error.
      </p>
      <Button onClick={() => navigate('/')} variant="default">
        Go to Dashboard
      </Button>
    </div>
  );
}
