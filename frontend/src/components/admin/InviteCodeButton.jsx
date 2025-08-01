/* eslint-disable react/prop-types */
import { useState } from 'react';
import axios from 'axios';
import { FiKey } from 'react-icons/fi';  // Importing an icon
import { toast } from 'sonner';
import { GENERATE_INVITE_CODE_API } from '@/utils/constants';

const InviteCodeButton = ({ roomId }) => {
  const [inviteCode, setInviteCode] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateInviteCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${GENERATE_INVITE_CODE_API}/${roomId}`,
        {},
        {
          withCredentials: true, // Ensures cookies are sent with the request
        }
      );

      if(response.data.success) {
        setInviteCode(response.data.inviteCode);
        toast.success(response.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error generating invite code');
      toast.error(err.response?.data?.message || 'Error generating invite code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="invite-code-container space-y-6">
      <button
        className="w-full bg-gradient-to-r from-blue-500 to-teal-500 text-white px-6 py-3 rounded-lg shadow-md hover:from-blue-600 hover:to-teal-600 transition duration-300 transform hover:scale-105"
        onClick={generateInviteCode}
        disabled={loading}
      >
        {loading ? (
          <span className="flex items-center justify-center space-x-2">
            <span>Generating...</span>
            <div className="w-4 h-4 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          </span>
        ) : (
          <span className="flex items-center justify-center space-x-2">
            <FiKey />
            <span>Generate Invite Code</span>
          </span>
        )}
      </button>

      {inviteCode && (
        <div className="text-lg font-semibold text-green-600 bg-green-100 p-4 rounded-lg shadow-md">
          <span className="font-bold">Invite Code:</span> {inviteCode}
        </div>
      )}

      {error && (
        <div className="text-lg font-semibold text-red-600 bg-red-100 p-4 rounded-lg shadow-md">
          <span className="font-bold">Error:</span> {error}
        </div>
      )}
    </div>
  );
};

export default InviteCodeButton;
