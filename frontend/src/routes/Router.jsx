import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import LandingPage from '../components/LandingPage';
import SetupRoom from '../components/auth/Setup-Room';
import Login from '../components/auth/Login';
import DashboardAdmin from '../pages/admin/Dashboard-admin';
import FindRoom from '../components/auth/Find-Room';
import AddMember from '../components/auth/AddMember';
import JoinMember from '../components/auth/JoinMember';
import LoginMember from '../components/auth/LoginMember';
import DashboardMember from '../pages/member/Dashboard-member';
import Signup from '../components/auth/Signup';
import JoinAdmin from '../components/auth/JoinAdmin';
import RegisterAdmin from '../components/auth/RegisterAdmin';
import ProtectedRoute1 from '../components/ProtectedRoute1';
import DashboardDeviceSetup from '../components/dashboard/DashBoardDeviceSetup';
import DeviceSetup from '@/components/dashboard/DeviceSetup';
import AdminUserDetails from '@/components/admin/adminUserDetails';
import QuickGuide from '../components/QuickGuide';
import AddMacAddress from '@/components/admin/StoreMacAddress';
import RegisterAdminGuide from '@/components/quick-guide/RegisterAdminGuide';
import RegisterMemberGuide from '@/components/quick-guide/RegisterMemberGuide';
import InviteMemberGuide from '@/components/quick-guide/InviteMemberGuide';

// Define your routes
const browserRouter = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />
  },
  {
    path: "/quick-guide",
    element: <QuickGuide />
  },
  {
    path: "/quick-guide/register-as-admin",
    element: <RegisterAdminGuide />
  },
  {
    path: "/quick-guide/register-as-member",
    element: <RegisterMemberGuide />
  },
  {
    path: "quick-guide/invite-member",
    element: <InviteMemberGuide />
  },
  {
    path: "/setup-room",
    element: <SetupRoom />
  },
  {
    path: "/signup",
    element: <Signup />
  },
  {
    path: "/login",
    element: <Login />
  },
  {
    path: `/admin/dashboard/:roomId`,
    element: <ProtectedRoute1><DashboardAdmin /></ProtectedRoute1>
  },
  {
    path: "/find-room",
    element: <FindRoom />
  },
  {
    path: "/add-member",
    element: <AddMember />
  },
  {
    path: "/add-member/join",
    element: <JoinMember />
  },
  {
    path: "/add-member/login",
    element: <LoginMember />
  },
  {
    path: `/member/dashboard`,
    element: <DashboardMember />
  },
  {
    path: "/add-admin",
    element: <JoinAdmin />
  },
  {
    path: "/add-admin/register",
    element: <RegisterAdmin />
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
    path: "/admin/:roomId/store/mac-addresses",
    element: <ProtectedRoute1><AddMacAddress /></ProtectedRoute1>
  }
  
]);

// Export the RouterProvider to be used in App.jsx
const AppRouter = () => {
  return <RouterProvider router={browserRouter} />;
};

export default AppRouter;
