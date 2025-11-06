/* eslint-disable no-unused-vars */
import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Shield, LogOut, Key, Copy, Check, Info, ChefHat } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { persistStore } from 'redux-persist'
import store from '@/redux/store';
import { toast } from 'sonner';
import { GET_USER_DETAILS_API, LOGOUT_API } from '@/utils/constants';

const DashboardAdmin = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userDetails, setUserDetails] = useState('');
  const [copied, setCopied] = useState(false);
  const dispatch = useDispatch();
  let persistor = persistStore(store);
  const user = useSelector((state) => state.auth?.user);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      setCopied(true);
      toast.success('Room ID copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Failed to copy Room ID');
    }
  };

  const logoutHandler = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${LOGOUT_API}`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        dispatch(logout());
        persistor.purge();
        navigate('/login');
        toast.success(res.data.message);
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Logout failed');
      toast.error(error.response?.data?.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handelGetUserDetails = async () => {
    try {
      const res = await axios.get(`${GET_USER_DETAILS_API}/${user?._id}`, {
        withCredentials: true
      });

      if (res.data.success) {
        setUserDetails(res.data.user);
        navigate(`/admin/${user?._id}`);
        toast.success(res.data.message);
      }

    } catch (error) {
      console.error(error.response?.data?.message || 'Error fetching user details');
      toast.error(error.response?.data?.message || 'Error fetching user details');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-indigo-100 to-purple-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-indigo-100 rounded-xl backdrop-blur-sm bg-opacity-80">
              <Shield className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500">Manage your room settings and access</p>
            </div>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className="space-x-2 bg-white bg-opacity-50 backdrop-blur-sm"
                  onClick={logoutHandler}
                  disabled={loading}
                >
                  <LogOut className="w-4 h-4 text-red-600" />
                  <span className='text-red-600'>{loading ? 'Logging out...' : 'Logout'}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Sign out of your account</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {roomId ? (
          <div className="grid gap-6">
            <Card className="backdrop-blur-sm bg-white bg-opacity-90">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Room Information</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono">
                      {roomId}
                    </Badge>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-2 hover:bg-gray-100 rounded-full"
                        >
                          <Info className="w-4 h-4 text-indigo-600" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                          <DialogTitle className="flex items-center space-x-2">
                            <Shield className="w-5 h-5 text-indigo-600" />
                            <span>What is Room ID?</span>
                          </DialogTitle>
                          <DialogDescription className="pt-4 space-y-3 text-left">
                            <p className="text-gray-700">
                              The <span className="font-semibold text-indigo-600">Room ID</span> is a unique identifier for your room. It is directly linked with your admin account.
                            </p>
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                              <p className="text-red-800 font-medium flex items-center space-x-2">
                                <Shield className="w-4 h-4" />
                                <span>Important Security Notice</span>
                              </p>
                              <p className="text-red-700 text-sm mt-2">
                                Do not share your Room ID with anyone. Keep it confidential to maintain the security of your room.
                              </p>
                            </div>
                          </DialogDescription>
                        </DialogHeader>
                      </DialogContent>
                    </Dialog>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-2 hover:bg-gray-100"
                            onClick={copyRoomId}
                          >
                            {copied ? (
                              <Check className="w-4 h-4 text-green-600" />
                            ) : (
                              <Copy className="w-4 h-4 text-gray-600" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{copied ? 'Copied!' : 'Copy Room ID'}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Link
                    to={`/admin/dashboard/${user.room}/device-setup`}
                    className="group relative p-6 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200">
                        <Key className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        Access Control
                      </span>
                      <span className="text-sm text-gray-500 group-hover:text-gray-700">
                        Manage Devices
                      </span>
                    </div>
                  </Link>

                  <button
                    onClick={handelGetUserDetails}
                    className="group relative p-6 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200">
                        <span className="text-xl font-medium w-6 h-6 text-indigo-600 group-hover:text-indigo-700">
                          U
                        </span>
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        User Details
                      </span>
                      <span className="text-sm text-gray-500 group-hover:text-gray-700">
                        User Information
                      </span>
                    </div>
                  </button>

                  <Link
                    to={`/admin/dashboard/${user.room}/recipes`}
                    className="group relative p-6 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 group-hover:from-blue-200 group-hover:to-purple-200">
                        <ChefHat className="w-6 h-6 text-indigo-600 group-hover:text-indigo-700" />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        Smart Cooking Assistant
                      </span>
                      <span className="text-sm text-gray-500 group-hover:text-gray-700">
                        Manage Recipes
                      </span>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="text-center p-12 backdrop-blur-sm bg-white bg-opacity-90">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-red-600">No Room ID Provided</h2>
              <p className="text-gray-500">Please make sure to include a valid room ID in the URL</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate('/')}
              >
                Return to Home
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default DashboardAdmin;