import { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DeviceCard from './DeviceCard';
import { ArrowLeft, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { GET_DEVICES_API, LOGOUT_API} from '@/utils/constants';
import { Button } from '@/components/ui/button';
import logo from "../../assets/logo.webp";
import { useDispatch } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { persistStore } from 'redux-persist'
import store from '@/redux/store';


const DeviceSetup = () => {
    const [status, setStatus] = useState('');
    const [deviceName, setDeviceName] = useState('');
    const [mac, setMac] = useState('');
    const [ipAddress, setIpAddress] = useState('');
    const { roomId, deviceId } = useParams();
    // eslint-disable-next-line no-unused-vars
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate();
    const dispatch = useDispatch();
    let persistor = persistStore(store);



    useEffect(() => {
        const fetchDevices = async () => {
            try {
                const response = await axios.get(`${GET_DEVICES_API}/${roomId}`, {
                    withCredentials: true
                });
                if (response.data.success) {
                    const device = response.data.devices.find(device => device._id === deviceId);
                    if (device) {
                        setDeviceName(device.name);
                        setStatus(device.status);
                        setMac(device.macAddress);
                        setIpAddress(device.ipAddress);
                    }
                }
            } catch (err) {
                console.error('Error fetching devices:', err);
                toast.error(err.response.data.message);
            }
        };
        fetchDevices();
    }, [roomId, deviceId]);

    

   

    const goBack = () => {
        navigate(`/admin/dashboard/${roomId}/device-setup`);
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

            {/* Sub Header */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center space-x-3 mb-2">
                        <button
                            onClick={goBack}
                            className="hover:bg-gray-100 p-1 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <h1 className="text-2xl font-semibold text-gray-900">Device Setup</h1>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-gray-500">Configure and manage your device settings</p>
                        <span className="inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                            Room ID: {roomId}
                        </span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-lg border shadow-sm">
                    <DeviceCard
                        device={{ deviceName, status, mac, ipAddress }}
                        deviceId={deviceId}
                    />
                </div>
            </main>
        </div>
    );
};

export default DeviceSetup;