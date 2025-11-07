/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import axios from 'axios';
import AddDevice from './AddDevice';
import Sidebar from './LeftSideBar';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { GET_DEVICES_API, LOGOUT_API } from '@/utils/constants';
import { Activity, ChevronRight, LogOut, Power, ShieldCheck, } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import logo from "../../assets/logo.webp";
import { Button } from '../ui/button';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { persistStore } from 'redux-persist'
import store from '@/redux/store';


const Dashboard = () => {
  const [devices, setDevices] = useState([]);
  const { roomId } = useParams();
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate();
  const dispatch = useDispatch();
  let persistor = persistStore(store);
  const user = useSelector(state => state?.auth?.user);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const response = await axios.get(`${GET_DEVICES_API}/${roomId}`, {
          withCredentials: true
        });
        if (response.data.success) {
          setDevices(response.data.devices);
        }
      } catch (err) {
        console.error('Error fetching devices:', err);
        toast.error(err.response.data.message || 'No devices found');
      }
    };

    fetchDevices();
  }, [roomId]);

  const handleDeviceRegistered = (newDevice) => {
    setDevices((prevDevices) => [...prevDevices, newDevice]);
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="w-full bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/">
              <div className="flex items-center">

                <img src={logo} alt="Nexus-Hub Logo" className="h-8" />
                <h1 className="text-xl font-semibold text-gray-800 ml-3">
                  Nexus-Hub
                </h1>

              </div>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={logoutHandler}
              className="text-gray-600 hover:text-red-500"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200">
          <Sidebar devices={devices} roomId={roomId} />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Breadcrumb */}
            <div className="flex items-center text-sm mb-6">
              <Link to={`/admin/dashboard/${user.room}`} className="text-blue-500 hover:underline">
                <span className="text-gray-500">Dashboard</span>
              </Link>

              <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
              <span className="font-medium text-gray-900">Device Setup</span>
            </div>

            {/* Page Header */}
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Device Setup</h1>
                <p className="text-sm text-gray-500 mt-1">Manage and configure your connected devices</p>
              </div>
              <div className="flex items-center">
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                  Room ID: {roomId}
                </span>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Devices</CardTitle>
                  <div className="p-2 rounded-lg bg-blue-50">
                    <Activity className="w-4 h-4 text-blue-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{devices.length}</div>
                  <p className="text-xs text-gray-500 mt-1">Connected to this room</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Devices</CardTitle>
                  <div className="p-2 rounded-lg bg-green-50">
                    <Power className="w-4 h-4 text-green-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {devices.filter(device => device.status === 'on').length}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Currently online</p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow duration-200">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-gray-600">Room Status</CardTitle>
                  <div className="p-2 rounded-lg bg-purple-50">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Active</div>
                  <p className="text-xs text-gray-500 mt-1">System operational</p>
                </CardContent>
              </Card>
            </div>

            {/* Add Device Section */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Device</CardTitle>
                <p className="text-sm text-gray-500">Connect and configure a new device to your room</p>
              </CardHeader>
              <CardContent>
                <AddDevice roomId={roomId} onDeviceRegistered={handleDeviceRegistered} />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;