import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, ShieldCheck } from 'lucide-react';
import { Link } from "react-router-dom";
import logo from '../../assets/logo.webp';

const FindRoom = () => {
    const handleAddmember = () => {
        window.location.href = '/add-member';
    };

    const handleJoinAsAdmin = () => {
        window.location.href = '/add-admin';
    };



    return (
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-blue-600 to-blue-700">

            <div className="w-full flex items-center p-4 bg-blue-800">
                <Link to="/" className="flex items-center gap-2 ml-4">
                    <img src={logo} alt="LumenHive Logo" className="h-10 w-auto" />
                    <span className="font-bold text-2xl text-white">LumenHive</span>
                </Link>
            </div>

            {/* Main Card */}
            <div className="flex-grow flex items-center justify-center">
                <Card className="w-96 shadow-xl">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">
                            Join Room
                        </CardTitle>
                        <CardDescription className="text-center">
                            Choose how you&apos;d like to join
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                        <Button
                            className="w-full h-11 text-base font-medium"
                            onClick={handleAddmember}
                        >
                            <Users className="w-5 h-5 mr-2" />
                            Join as Member
                        </Button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    or
                                </span>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-11 text-base font-medium"
                            onClick={handleJoinAsAdmin}
                        >
                            <ShieldCheck className="w-5 h-5 mr-2" />
                            Join as Admin
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default FindRoom;
