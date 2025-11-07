import PropTypes from "prop-types";
import { useState } from "react";
import { Settings, X, Zap } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { DEVICE_UPDATE } from '@/utils/constants';

const DeviceCard = ({ device, deviceId }) => {
  const { deviceName, status, mac, ipAddress } = device;
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updateForm, setUpdateForm] = useState({
    name: deviceName,
    macAddress: mac,
    ssid: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateDevice = async () => {
    setLoading(true);
    try {
      const response = await axios.put(`${DEVICE_UPDATE}/${deviceId}`, updateForm, {
        withCredentials: true
      });

      if (response.data.success) {
        toast.success(response.data.message);
        setShowUpdateForm(false);
        // You might want to refresh the device data here
        window.location.reload(); // Simple refresh, or implement proper state update
      }
    } catch (error) {
      console.error('Error updating device:', error);
      toast.error(error.response?.data?.error || 'Failed to update device');
    } finally {
      setLoading(false);
    }
  };

  const handleControlAppliances = () => {
    if (ipAddress) {
      window.open(`http://${ipAddress}`, '_blank');
    } else {
      toast.error('IP address not available');
    }
  };

  return (
    <div className="p-6">
      {/* Device Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-800">{deviceName}</h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${status === "on" ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="text-sm text-gray-600">
              {status === "active" ? "Active" : "Inactive"}
            </span>
          </div>

          {ipAddress && (
            <button
              onClick={handleControlAppliances}
              className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Control Appliances</span>
            </button>
          )}

          <button
            onClick={() => setShowUpdateForm(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Update Device</span>
          </button>
        </div>
      </div>

      {/* Device Status and Controls */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-gray-500">Device Status</h3>
            <p className="mt-1 text-lg font-medium text-gray-900">
              {status === "active" ? "Currently Active" : "Currently Inactive"}
            </p>
          </div>
          <p className="mt-1 text-m font-medium text-gray-900">MAC ADDRESS :
            <span className="mt-1 ml-4 text-sm font-medium text-blue-600">{mac}</span>
          </p>
        </div>
      </div>
      {ipAddress && (
        <>
          <p className="text-sm font-medium text-gray-500 mt-2">Current IP ADDRESS</p>
          <span className="text-sm font-medium text-green-600">{ipAddress}</span>
        </>
      )}

      {/* Update Device Form Modal */}
      {showUpdateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Update Device</h3>
              <button
                onClick={() => setShowUpdateForm(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Device Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={updateForm.name}
                  onChange={handleUpdateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter device name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  MAC Address
                </label>
                <input
                  type="text"
                  name="macAddress"
                  value={updateForm.macAddress}
                  onChange={handleUpdateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter MAC address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WiFi SSID
                </label>
                <input
                  type="text"
                  name="ssid"
                  value={updateForm.ssid}
                  onChange={handleUpdateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter WiFi SSID"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  WiFi Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={updateForm.password}
                  onChange={handleUpdateFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter WiFi password"
                />
              </div>
            </form>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowUpdateForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateDevice}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

DeviceCard.propTypes = {
  device: PropTypes.shape({
    deviceName: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    mac: PropTypes.string.isRequired,
    ipAddress: PropTypes.string.isRequired,
  }).isRequired,
  deviceId: PropTypes.string.isRequired,
};

export default DeviceCard;