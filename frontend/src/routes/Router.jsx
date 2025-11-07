import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import SetupRoom from '../components/auth/Setup-Room';
import Login from '../components/auth/Login';
import DashboardAdmin from '../pages/admin/Dashboard-admin';
import Signup from '../components/auth/Signup';
import ProtectedRoute1 from '../components/ProtectedRoute1';
import DashboardDeviceSetup from '../components/dashboard/DashBoardDeviceSetup';
import DeviceSetup from '@/components/dashboard/DeviceSetup';
import AdminUserDetails from '@/components/admin/adminUserDetails';
import QuickGuide from '../components/QuickGuide';
import RegisterAdminGuide from '@/components/quick-guide/RegisterAdminGuide';
import RegisterMemberGuide from '@/components/quick-guide/RegisterMemberGuide';
import InviteMemberGuide from '@/components/quick-guide/InviteMemberGuide';
import PublicRoute from '@/components/PublicRoute';
import RecipeDashboard from '@/pages/admin/Recipe';

// Define your routes
const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: <PublicRoute><LandingPage /></PublicRoute>
  },
  {
    path: "/quick-guide",
    element: <PublicRoute><QuickGuide /></PublicRoute>
  },
  {
    path: "/quick-guide/register-as-admin",
    element: <PublicRoute><RegisterAdminGuide /></PublicRoute>
  },
  {
    path: "/quick-guide/register-as-member",
    element: <PublicRoute><RegisterMemberGuide /></PublicRoute>
  },
  {
    path: "quick-guide/invite-member",
    element: <PublicRoute><InviteMemberGuide /></PublicRoute>
  },
  {
    path: "/setup-room",
    element: <PublicRoute><SetupRoom /></PublicRoute>
  },
  {
    path: "/signup",
    element: (
        <PublicRoute>
            <Signup />
        </PublicRoute>
    )
},
{
    path: "/login",
    element: (
        
            <Login />
        
    )
},
  {
    path: `/admin/dashboard/:roomId`,
    element: <ProtectedRoute1><DashboardAdmin /></ProtectedRoute1>
  },
  {
    path: "/admin/dashboard/:roomId/device-setup",
    element: <ProtectedRoute1><DashboardDeviceSetup /></ProtectedRoute1>
  },
  {
    path: "/admin/dashboard/:roomId/device-setup/:deviceId",
    element: <ProtectedRoute1><DeviceSetup /></ProtectedRoute1>
  },
  {
    path: "/admin/:userId",
    element: <ProtectedRoute1><AdminUserDetails /></ProtectedRoute1>
  },
  {
    path: "/admin/dashboard/:roomId/recipes",
    element: <ProtectedRoute1><RecipeDashboard /></ProtectedRoute1>
  },
  {
    path: "/admin/dashboard/:roomId/recipes",
    element: <ProtectedRoute1>
      <RecipeDashboard />
      </ProtectedRoute1>
  }
  
  
]);

// Export the RouterProvider to be used in App.jsx
const AppRouter = () => {
  return <RouterProvider router={browserRouter} />;
};

export default AppRouter;
