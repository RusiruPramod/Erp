import React from 'react';
import { Outlet } from 'react-router-dom';

export const AppLayout: React.FC = () => {
  return (
    <div className="h-screen w-full bg-[#EEF1F5] overflow-hidden text-primary">
      <main className="h-full w-full overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
};

