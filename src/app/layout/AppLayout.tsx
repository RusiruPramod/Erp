import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex h-screen w-full bg-white text-neutral-900 overflow-hidden">
      <Sidebar />
      <main className="flex-1 h-screen overflow-hidden bg-white">
        <Outlet />
      </main>
    </div>
  );
};
