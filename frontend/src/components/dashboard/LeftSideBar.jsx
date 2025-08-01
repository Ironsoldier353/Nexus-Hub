/* eslint-disable react/prop-types */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Laptop, ChevronRight, LogOut, Layers } from 'lucide-react'; // Import Info icon
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { persistStore } from 'redux-persist';
import store from '@/redux/store';
import axios from 'axios';
import { toast } from 'sonner';
import { GET_USER_DETAILS_API, LOGOUT_API } from '@/utils/constants';

const Sidebar = ({ devices, roomId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  let persistor = persistStore(store);
  const user = useSelector((state) => state.auth?.user);

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
      }
    } catch (error) {
      console.error(error.response?.data?.message || 'Logout failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDeviceClick = (deviceId) => {
    navigate(`/admin/dashboard/${roomId}/device-setup/${deviceId}`);
  };
  const handelGetUserDetails = async () => {
    try {
      const res = await axios.get(`${GET_USER_DETAILS_API}/${user?._id}`, {
        withCredentials: true
      });

      if (res.data.success) {

        navigate(`/admin/${user?._id}`);
        toast.success(res.data.message);
      }

    } catch (error) {
      console.error(error.response?.data?.message || 'Error fetching user details');
      toast.error(error.response?.data?.message || 'Error fetching user details');
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Main Content */}
      <div className="flex-1 p-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 px-2">
            <Laptop className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Devices</h3>
          </div>
        </div>

        {/* Devices List */}
        <ul className="space-y-1">
          {devices.map((device) => (
            <li
              key={device._id}
              onClick={() => handleDeviceClick(device?._id)}
              className="flex items-center justify-between px-2 py-2 rounded-md cursor-pointer hover:bg-gray-100 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <Layers className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-700 font-medium">
                  {device.name}
                </span>
              </div>
              <ChevronRight
                className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors"
              />
            </li>
          ))}

        </ul>

        {/* Empty State */}
        {devices.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No devices found</p>
          </div>
        )}
      </div>

      {/* User Info and Logout Section */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex flex-col space-y-4">
          <button className=' hover:bg-blue-100 transition-colors group' onClick={handelGetUserDetails}>
            <div className="flex items-center space-x-3 px-2">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-sm font-medium text-gray-600">
                  U
                </span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{user?.username || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'user@example.com'}</p>
              </div>
            </div>
          </button>
          <button
            onClick={logoutHandler}
            disabled={loading}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm font-medium">
              {loading ? 'Logging out...' : 'Sign Out'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;