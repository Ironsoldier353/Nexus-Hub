import { User, Mail, Home, LogOut, CornerUpLeft, Crown, Minus } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '@/redux/authSlice';
import { persistStore } from 'redux-persist';
import store from '@/redux/store';
import { toast } from 'sonner';
import axios from "axios";
import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { GET_USER_DETAILS_API, LOGOUT_API, REMOVE_MEMBER_API } from "@/utils/constants";


const AdminUserDetails = () => {
    const [loading, setLoading] = useState(false);
    const [user, setUser] = useState([]);

    const { userId } = useParams();


    const user1 = useSelector((state) => state.auth.user);

    const navigate = useNavigate();
    const dispatch = useDispatch();
    let persistor = persistStore(store);

    const logoutHandler = async () => {
        setLoading(true);



        try {
            if (user1._id === userId) {
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


            } else {
                toast.error('You are not logged in');
                navigate('/login');
            }


        } catch (error) {
            console.error(error.response?.data?.message || 'Logout failed');
            toast.error(error.response?.data?.message || 'Logout failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const handelGetUserDetails = async () => {
            try {
                const res = await axios.get(`${GET_USER_DETAILS_API}/${userId}`, {
                    withCredentials: true
                });

                if (res.data.success) {
                    setUser(res.data.user);
                    toast.success(res.data.message);
                }

            } catch (error) {
                console.error(error.response?.data?.message || 'Error fetching user details');
                toast.error(error.response?.data?.message || 'Error fetching user details');
            }
        }

        handelGetUserDetails();
    }, [userId]);

    const userDetails = [
        { icon: User, label: "Username", value: user.username },
        { icon: Mail, label: "Email", value: user.email },
        { icon: Home, label: "Room ID", value: user.room || 'No Room Assigned' },
        { icon: Crown, label: "Role", value: user.role }
    ];

    const goToDashboard = () => {
        window.history.back();
    }

    const handelRemoveMember = async () => {
        const memberId = userId;
        const roomId = user1.room;

        try {
            const res = await axios.delete(`${REMOVE_MEMBER_API}/${roomId}`, {
                data: { memberId },
                withCredentials: true
            });

            if (res.data.success) {
                toast.success(res.data.message);
                navigate(`/admin/dashboard/${roomId}`);
            }
        } catch (error) {
            console.error(error.response?.data?.message || 'Error removing member');
            toast.error(error.response?.data?.message || 'Error removing member');

        }

    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-white to-gray-200 p-6">
            {/* Back Button */}
            <button
                onClick={goToDashboard}
                className="fixed top-4 left-4 p-3 rounded-full bg-indigo-50 hover:bg-indigo-100 transition-all duration-300 shadow-md"
            >
                <CornerUpLeft className="h-5 w-5 text-indigo-600" />
            </button>

            {/* Logout Button */}
            {
                user1._id === userId && (
                    <Button
                        variant="outline"
                        className="absolute top-4 right-4 flex items-center space-x-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-100 transition-all duration-300 shadow-md"
                        onClick={logoutHandler}
                        disabled={loading}
                    >
                        <LogOut className="h-5 w-5 text-red-600" />
                        <span className="text-red-600">{loading ? 'Logging out...' : 'Logout'}</span>
                    </Button>
                )
            }

            {user1._id !== userId && user.role === 'member' && (
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-lg">
                    <Button
                        variant="outline"
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-full bg-red-50 hover:bg-red-200 transition-all duration-300 shadow-md w-full"
                        onClick={handelRemoveMember}
                    >
                        <Minus className="h-5 w-5 text-red-600" />
                        <span className="text-red-600 font-semibold">Remove Member</span>
                    </Button>
                </div>
            )}



            <div className="flex items-center justify-center min-h-full">
                <Card className="max-w-lg w-full p-6 rounded-3xl shadow-xl bg-white">
                    <CardHeader className="space-y-2 text-center">
                        <CardTitle className="text-3xl font-bold text-gray-800">
                            User Details
                        </CardTitle>
                        <div className="h-1 w-24 bg-indigo-500 mx-auto rounded-full" />
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        {userDetails.map(({ icon: Icon, label, value }) => (
                            <div
                                key={label}
                                className="flex items-center p-5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-transform duration-200 transform hover:scale-105 shadow-sm"
                            >
                                <div className="p-3 bg-indigo-100 rounded-full">
                                    <Icon className="h-6 w-6 text-indigo-600" />
                                </div>
                                <div className="ml-4 flex-1">
                                    <h3 className="text-sm font-medium text-gray-500">
                                        {label}
                                    </h3>
                                    <p className={`text-lg font-semibold text-gray-800 ${label === "Email" ? "" : "capitalize"}`}>
                                        {value}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default AdminUserDetails;
