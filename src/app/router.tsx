import React, { Suspense, lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layout/AppLayout';
import { RequireAuth } from './guards/RequireAuth';
import { RequireAdmin } from './guards/RequireAdmin';
import { Skeleton } from '../components/ui/Skeleton';

// Code-split route components for fast initial load
const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then(m => ({ default: m.LoginPage }))
);
const PublicDocumentViewPage = lazy(() =>
  import('../features/documents/PublicDocumentViewPage').then(m => ({
    default: m.PublicDocumentViewPage,
  }))
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then(m => ({
    default: m.DashboardPage,
  }))
);
const QuickStudioPage = lazy(() =>
  import('../features/studio/QuickStudioPage').then(m => ({
    default: m.QuickStudioPage,
  }))
);
const AdCampaignLedgerPage = lazy(() =>
  import('../features/campaigns/AdCampaignLedgerPage').then(m => ({
    default: m.AdCampaignLedgerPage,
  }))
);
const OrdersPage = lazy(() =>
  import('../features/orders/OrdersPage').then(m => ({
    default: m.OrdersPage,
  }))
);
const ProjectsListPage = lazy(() =>
  import('../features/projects/ProjectsListPage').then(m => ({
    default: m.ProjectsListPage,
  }))
);
const ProjectDetailPage = lazy(() =>
  import('../features/projects/ProjectDetailPage').then(m => ({
    default: m.ProjectDetailPage,
  }))
);
const CustomersListPage = lazy(() =>
  import('../features/customers/CustomersListPage').then(m => ({
    default: m.CustomersListPage,
  }))
);
const ExpensesPage = lazy(() =>
  import('../features/expenses/ExpensesPage').then(m => ({
    default: m.ExpensesPage,
  }))
);
const LedgerPage = lazy(() =>
  import('../features/ledger/LedgerPage').then(m => ({
    default: m.LedgerPage,
  }))
);
const DocumentsListPage = lazy(() =>
  import('../features/documents/DocumentsListPage').then(m => ({
    default: m.DocumentsListPage,
  }))
);
const DocumentEditorPage = lazy(() =>
  import('../features/documents/DocumentEditorPage').then(m => ({
    default: m.DocumentEditorPage,
  }))
);
const TeamPage = lazy(() =>
  import('../features/team/TeamPage').then(m => ({
    default: m.TeamPage,
  }))
);
const SettingsPage = lazy(() =>
  import('../features/settings/SettingsPage').then(m => ({
    default: m.SettingsPage,
  }))
);

const PageLoader = () => (
  <div className="space-y-4 p-4 md:p-6 animate-in fade-in">
    <Skeleton className="h-8 w-48" />
    <Skeleton className="h-4 w-72" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
      <Skeleton className="h-28 rounded-xl" />
    </div>
    <Skeleton className="h-64 rounded-xl mt-4" />
  </div>
);

export const router = createBrowserRouter([
  // Public Login Route
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },

  // Public Client View Route for WhatsApp links (No login required)
  {
    path: '/d/:token',
    element: (
      <Suspense fallback={<PageLoader />}>
        <PublicDocumentViewPage />
      </Suspense>
    ),
  },

  // Protected Routes
  {
    path: '/',
    element: (
      <RequireAuth>
        <AppLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'invoice',
        element: (
          <Suspense fallback={<PageLoader />}>
            <QuickStudioPage />
          </Suspense>
        ),
      },
      {
        path: 'campaigns',
        element: (
          <Suspense fallback={<PageLoader />}>
            <AdCampaignLedgerPage />
          </Suspense>
        ),
      },
      {
        path: 'orders',
        element: (
          <Suspense fallback={<PageLoader />}>
            <OrdersPage />
          </Suspense>
        ),
      },
      {
        path: 'expenses',
        element: (
          <Suspense fallback={<PageLoader />}>
            <ExpensesPage />
          </Suspense>
        ),
      },
      {
        path: 'ad-campaigns',
        element: <Navigate to="/campaigns" replace />,
      },
      {
        path: 'campaign-ledger',
        element: <Navigate to="/campaigns" replace />,
      },
      {
        path: 'create-invoice',
        element: <Navigate to="/invoice" replace />,
      },
      {
        path: 'studio',
        element: <Navigate to="/invoice" replace />,
      },
      {
        path: '*',
        element: <Navigate to="/dashboard" replace />,
      },
    ],
  },

  // Catch-all route
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);
