/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import { useState } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { GENERATE_ROOM_DETAILS_API } from '@/utils/constants';

const RoomDetails = ({ roomId }) => {
  const [roomDetails, setRoomDetails] = useState(null);
  const [error, setError] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadingUser, setLoadingUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const navigate = useNavigate();

  const fetchRoomDetails = async () => {
    setLoadingDetails(true);
    setError(null);

    try {
      const response = await axios.get(
        `${GENERATE_ROOM_DETAILS_API}/${roomId}`,
        { withCredentials: true }
      );
      if (response.data.success) {
        setRoomDetails(response.data.room); 
        console.log(response.data.room);
        toast.success(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error fetching room details');
      toast.error(err.response?.data?.message || err.message || 'Error fetching room details');
    } finally {
      setLoadingDetails(false);
    }
  };

  

  return (
    <div>
      <button
        className="w-full bg-green-500 text-white px-6 py-3 rounded-lg shadow-md hover:bg-green-600 transition duration-300 transform hover:scale-105"
        onClick={fetchRoomDetails}
        disabled={loadingDetails}
      >
        {loadingDetails ? 'Fetching...' : 'Get Room Details'}
      </button>

      {roomDetails && (
        <div className="mt-6 space-y-4">
          <h3 className="text-2xl font-semibold text-gray-800">Room Details</h3>
          <div>
            <h4 className="font-semibold">Admin:</h4>
            <ul className="text-gray-700">
              {roomDetails.admin.map((admin) => (
                <li
                  key={admin._id}
                  className="cursor-pointer text-blue-500 hover:underline"
                  onClick={() => {navigate(`/admin/${admin._id}`);}}
                >
                  {admin.email}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold">Members:</h4>
            <ul className="text-gray-700">
              {roomDetails.members.map((member) => (
                <li
                  key={member._id}
                  className="cursor-pointer text-blue-500 hover:underline"
                  onClick={() => {navigate(`/admin/${member._id}`);}}
                >
                  
                  {member.email}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="mt-6 p-4 bg-gray-100 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-800">Selected User Details</h3>
          <p>
            <strong>ID:</strong> {selectedUser._id}
          </p>
          <p>
            <strong>Email:</strong> {selectedUser.email}
          </p>
          {/* Add more user details here if needed */}
        </div>
      )}

      {error && <p className="text-lg font-semibold text-red-600 mt-4">{error}</p>}
    </div>
  );
};

export default RoomDetails;
