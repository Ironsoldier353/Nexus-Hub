/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, LogOut, Smartphone, Monitor, Tablet, Copy, Check, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import axios from 'axios';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { persistStore } from 'redux-persist'
import store from '@/redux/store';
import { toast } from 'sonner';
import { GET_DEVICES_API, GET_USER_DETAILS_API, LOGOUT_API } from '@/utils/constants';

const DashboardMember = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [devicesLoading, setDevicesLoading] = useState(false);
  const [connectedDevices, setConnectedDevices] = useState([]);
  const [userDetails, setUserDetails] = useState('');
  const [copied, setCopied] = useState(false);
  const dispatch = useDispatch();
  let persistor = persistStore(store);
  const user = useSelector((state) => state.auth?.user);

  const getDeviceIcon = (deviceType) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
      case 'phone':
        return <Smartphone className="w-5 h-5" />;
      case 'tablet':
        return <Tablet className="w-5 h-5" />;
      case 'desktop':
      case 'laptop':
        return <Monitor className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

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

  const getConnectedDevices = async () => {
    setDevicesLoading(true);
    try {
      const res = await axios.get(
        `${GET_DEVICES_API}/${roomId}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        setConnectedDevices(res.data.devices || res.data.data || []);
        toast.success('Connected devices updated');
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Error fetching connected devices');
      toast.error(error.response?.data?.message || 'Error fetching connected devices');
    } finally {
      setDevicesLoading(false);
    }
  };

  const handelGetUserDetails = async () => {
    try {
      const res = await axios.get(`${GET_USER_DETAILS_API}/${user?._id}`, {
        withCredentials: true
      });

      if (res.data.success) {
        setUserDetails(res.data.user);
        toast.success(res.data.message); // Will show "User details fetched successfully"
      }

    } catch (error) {
      console.error(error.response?.data?.message || 'Error fetching user details');
      toast.error(error.response?.data?.message || 'Server error. Please Try again...');
    }
  };

  const formatDeviceUrl = (ipAddress) => {
    if (!ipAddress) return null;

    // Add protocol if not present
    if (!ipAddress.startsWith('http://') && !ipAddress.startsWith('https://')) {
      return `http://${ipAddress}`;
    }
    return ipAddress;
  };

  // Updated to handle navigation
  const handleDeviceClick = (device) => {
    const deviceUrl = formatDeviceUrl(device.ipAddress);
    if (deviceUrl) {
      toast.success(`Opening device: ${device.deviceName || device.name || 'Device'}`);
      window.open(deviceUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No IP address available for this device');
    }
  };

  // Auto-fetch devices on component mount
  useEffect(() => {
    if (roomId) {
      getConnectedDevices();
      handelGetUserDetails();
    }
  }, [roomId]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-100 via-teal-100 to-blue-100 py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header section */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-teal-100 rounded-xl backdrop-blur-sm bg-opacity-80">
              <Users className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Member Dashboard</h1>
              <p className="text-gray-500">View connected devices and room information</p>
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
            {/* Room Information Card */}
            <Card className="backdrop-blur-sm bg-white bg-opacity-90">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">Room Information</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline" className="font-mono">
                      {roomId}
                    </Badge>
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
                  <div className="group relative p-6 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm">
                    <div className="flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-teal-100 to-blue-100">
                        <Monitor className="w-6 h-6 text-teal-600" />
                      </div>
                      <span className="font-medium text-gray-700">
                        Connected Devices
                      </span>
                      <span className="text-2xl font-bold text-teal-600">
                        {connectedDevices.length}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handelGetUserDetails}
                    className="group relative p-6 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-teal-100 to-blue-100 group-hover:from-teal-200 group-hover:to-blue-200">
                        <span className="text-xl font-medium w-6 h-6 text-teal-600 group-hover:text-teal-700">
                          U
                        </span>
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        User Details
                      </span>
                      <span className="text-sm text-gray-500 group-hover:text-gray-700">
                        {userDetails?.username || 'Click to load'}
                      </span>
                    </div>
                  </button>

                  <button
                    onClick={getConnectedDevices}
                    disabled={devicesLoading}
                    className="group relative p-6 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="relative flex flex-col items-center space-y-3">
                      <div className="p-3 rounded-full bg-gradient-to-r from-teal-100 to-blue-100 group-hover:from-teal-200 group-hover:to-blue-200">
                        <RefreshCw className={`w-6 h-6 text-teal-600 group-hover:text-teal-700 ${devicesLoading ? 'animate-spin' : ''}`} />
                      </div>
                      <span className="font-medium text-gray-700 group-hover:text-gray-900">
                        Refresh Devices
                      </span>
                      <span className="text-sm text-gray-500 group-hover:text-gray-700">
                        {devicesLoading ? 'Loading...' : 'Update list'}
                      </span>
                    </div>
                  </button>
                </div>
              </CardContent>
            </Card>

            {/* Connected Devices Card */}
            <Card className="backdrop-blur-sm bg-white bg-opacity-90">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold flex items-center space-x-2">
                    <Monitor className="w-5 h-5 text-teal-600" />
                    <span>Connected Devices</span>
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={getConnectedDevices}
                    disabled={devicesLoading}
                    className="space-x-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${devicesLoading ? 'animate-spin' : ''}`} />
                    <span>Refresh</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {connectedDevices.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <Monitor className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Devices Connected</h3>
                    <p className="text-gray-500 mb-4">No devices are currently connected to this room</p>
                    <Button
                      variant="outline"
                      onClick={getConnectedDevices}
                      disabled={devicesLoading}
                    >
                      {devicesLoading ? 'Checking...' : 'Check Again'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {connectedDevices.map((device, index) => (
                      <div
                        key={device.id || index}
                        onClick={() => handleDeviceClick(device)}
                        className={`group relative p-4 rounded-lg border border-gray-200 bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-all duration-300 ${device.ipAddress ? 'cursor-pointer' : 'cursor-not-allowed'}`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                        <div className="relative space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 rounded-full bg-gradient-to-r from-teal-100 to-blue-100">
                                {getDeviceIcon(device.deviceType)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800">
                                  {device.deviceName || device.name || `Device ${index + 1}`}
                                </h4>
                              </div>
                            </div>
                            <Badge
                              variant={device.status === 'online' ? 'default' : 'secondary'}
                              className={device.status === 'online' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}
                            >
                              {device.status || 'Connected'}
                            </Badge>
                          </div>

                          {(device.ipAddress || device.lastSeen || device.userId) && (
                            <div className="space-y-1 text-sm text-gray-600">
                              {device.ipAddress && (
                                <div className="flex justify-between">
                                  <span>IP Address:</span>
                                  <span className="font-mono">{device.ipAddress}</span>
                                </div>
                              )}
                              {device.lastSeen && (
                                <div className="flex justify-between">
                                  <span>Last Seen:</span>
                                  <span>{new Date(device.lastSeen).toLocaleString()}</span>
                                </div>
                              )}
                              {device.userId && device.userId !== user?._id && (
                                <div className="flex justify-between">
                                  <span>Owner:</span>
                                  <span>{device.username || 'Other User'}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="text-center p-12 backdrop-blur-sm bg-white bg-opacity-90">
            <CardContent className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-red-600" />
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

export default DashboardMember;