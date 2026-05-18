import { RouterProvider } from 'react-router-dom';
import { useMemo } from 'react';
import { createAppRouter } from './routes';
import { Toaster } from './components/ui/sonner';
import { AppShellBootstrap } from './components/shared/AppShellBootstrap';
import './App.css';

function App() {
  const router = useMemo(() => createAppRouter(), []);

  return (
    <>
      <AppShellBootstrap />
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
