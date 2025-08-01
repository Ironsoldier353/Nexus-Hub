/* eslint-disable react/prop-types */
import { useState } from "react";
import PropTypes from "prop-types";
import axios from "axios";
import { toast } from "sonner";
import { REGISTER_DEVICES_API } from "@/utils/constants";


const AddDevice = ({ onDeviceRegistered, roomId }) => {

  const [deviceName, setDeviceName] = useState("");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [macAddress, setMacAddress] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newDevice = { deviceName,macAddress, ssid, password };
      const response = await axios.post(`${REGISTER_DEVICES_API}/${roomId}`,{ newDevice},{
        withCredentials: true,
      } );

      if (response.data.success) {
        onDeviceRegistered(response.data.device);

        setIsVisible(false);
        setDeviceName("");
        setSsid("");
        setPassword("");
        setMacAddress("");

        toast.success(response.data.message);

      }

    } catch (error) {
      console.error("Error registering device:", error);
      toast.error(error.response.data.message);

    }
  };

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-green-500 text-white py-2 px-4 rounded mt-4"
      >
        {isVisible ? "Close" : "Add Device"}
      </button>

      {isVisible && (
        <form onSubmit={handleSubmit} className="mt-4 p-4 border rounded shadow-lg">
          <h2 className="text-xl font-bold mb-4">Add New Device</h2>
          <div className="mb-4">
            <label className="block">Device Name</label>
            <input
              type="text"
              value={deviceName}
              onChange={(e) => setDeviceName(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block">Wi-Fi SSID</label>
            <input
              type="text"
              value={ssid}
              onChange={(e) => setSsid(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block">Wi-Fi Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block">MAC Address</label>
            <input
              type="text"
              value={macAddress}
              onChange={(e) => setMacAddress(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded mt-2"
          >
            Add Device
          </button>
        </form>
      )}
    </>
  );
};

// Add PropTypes for the onAddDevice prop
AddDevice.propTypes = {
  onAddDevice: PropTypes.func.isRequired,
};

export default AddDevice;
