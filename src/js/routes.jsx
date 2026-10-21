import HomePage from '../pages/home.jsx';
import InvoiceApprovalPage from '../pages/invoice-approval.jsx';
import ReportIssuesPage from '../pages/report-issues.jsx';
import MaintenancePage from '../pages/maintenance.jsx';
import LevyOverviewPage from '../pages/levy-overview.jsx';
import MyDocumentsPage from '../pages/my-documents.jsx';
import MyProfilePage from '../pages/my-profile.jsx';
import CommitteeDecisionsPage from '../pages/committee-decisions.jsx';
import PaymentPlanPage from '../pages/payment-plan.jsx';
import LoginPage from '../pages/login.jsx';
import AuthCallbackPage from '../pages/auth-callback.jsx';
import NotFoundPage from '../pages/404.jsx';
import { authService } from './services/auth.js';

/**
 * Route Guard: Requires authentication for any protected portal page.
 * If not authenticated, cancels route load and redirects directly to /login/.
 */
const requireAuth = ({ to, from, resolve, reject, router }) => {
  if (authService.isAuthenticated()) {
    resolve();
  } else {
    reject();
    try {
      router.navigate('/login/', { replaceState: true, clearPreviousHistory: true });
    } catch (err) {
      window.location.href = '/login/';
    }
  }
};

/**
 * Route Guard: If user is already authenticated, redirect /login/ to Home (/home/).
 */
const redirectIfAuth = ({ to, from, resolve, reject, router }) => {
  if (authService.isAuthenticated()) {
    reject();
    try {
      router.navigate('/home/', { replaceState: true, clearPreviousHistory: true });
    } catch (err) {
      window.location.href = '/home/';
    }
  } else {
    resolve();
  }
};

/**
 * Application Routes — Framework7
 * Protected routes are guarded by requireAuth to ensure one login for the whole web.
 */
const routes = [
  {
    path: '/',
    redirect() {
      return authService.isAuthenticated() ? '/home/' : '/login/';
    },
  },
  {
    path: '/home/',
    alias: ['/home'],
    component: HomePage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/home',
    component: HomePage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/invoices/',
    alias: ['/invoices'],
    component: InvoiceApprovalPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/invoices',
    component: InvoiceApprovalPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/report-issues/',
    alias: ['/report-issues'],
    component: ReportIssuesPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/report-issues',
    component: ReportIssuesPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/maintenance/report-issues/',
    alias: ['/maintenance/report-issues'],
    component: ReportIssuesPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/maintenance/report-issues',
    component: ReportIssuesPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/maintenance/',
    alias: [
      '/maintenance',
      '/maintenance/work-orders',
      '/maintenance/work-orders/',
      '/maintenance/quotations',
      '/maintenance/quotations/',
      '/maintenance/maintenance',
      '/maintenance/maintenance/',
    ],
    component: MaintenancePage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/maintenance',
    component: MaintenancePage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/levy/',
    alias: ['/levy', '/my-levy', '/my-levy/', '/levy-overview', '/levy-overview/'],
    component: LevyOverviewPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/levy',
    component: LevyOverviewPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/payment-plan/',
    alias: ['/payment-plan', '/payments', '/payments/'],
    component: PaymentPlanPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/payment-plan',
    component: PaymentPlanPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/payments/',
    alias: ['/payments'],
    component: PaymentPlanPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/payments',
    component: PaymentPlanPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/documents/',
    alias: ['/documents', '/my-documents', '/my-documents/'],
    component: MyDocumentsPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/documents',
    component: MyDocumentsPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/profile/',
    alias: ['/profile', '/my-profile', '/my-profile/', '/profile-settings', '/profile-settings/'],
    component: MyProfilePage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/profile',
    component: MyProfilePage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/committee/',
    alias: ['/committee', '/committee/decisions', '/committee/decisions/'],
    component: CommitteeDecisionsPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/committee/decisions/',
    alias: ['/committee/decisions'],
    component: CommitteeDecisionsPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/committee/decisions',
    component: CommitteeDecisionsPage,
    beforeEnter: requireAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/login/',
    alias: ['/login'],
    component: LoginPage,
    beforeEnter: redirectIfAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/login',
    component: LoginPage,
    beforeEnter: redirectIfAuth,
    options: {
      animate: false,
    },
  },
  {
    path: '/auth/callback/',
    alias: ['/auth/callback'],
    component: AuthCallbackPage,
    options: {
      animate: false,
    },
  },
  {
    path: '/auth/callback',
    component: AuthCallbackPage,
    options: {
      animate: false,
    },
  },
  {
    path: '/register/',
    alias: ['/register'],
    redirect: '/login/',
    options: {
      animate: false,
    },
  },
  {
    path: '/register',
    redirect: '/login/',
    options: {
      animate: false,
    },
  },
  {
    path: '(.*)',
    component: NotFoundPage,
    options: {
      animate: false,
    },
  },
];

export default routes;
