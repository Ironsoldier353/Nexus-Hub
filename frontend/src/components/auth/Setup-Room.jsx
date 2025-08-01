import { UserPlus, LogIn } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.webp';

const SetupRoom = () => {
  const handleSignUpClick = () => {
    window.location.href = '/signup';
  };

  const handleLoginClick = () => {
    window.location.href = '/login';
  };


  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-r from-blue-600 to-blue-700">
      <div className="w-full flex items-center p-4 bg-blue-800">
        <Link to="/" className="flex items-center gap-2 ml-4">
          <img src={logo} alt="LumenHive Logo" className="h-10 w-auto" />
          <span className="font-bold text-2xl text-white">LumenHive</span>
        </Link>
      </div>



      <div className="flex-grow flex items-center justify-center">
        <Card className="w-96 shadow-xl">
          <CardHeader className="space-y-1 pb-2">
            <CardTitle className="text-2xl font-bold text-center">
              Hii Admin, Welcome to Our Platform
            </CardTitle>
            <CardDescription className="text-center">
              Please sign up or login to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            <Button
              className="w-full h-11 text-base font-medium"
              onClick={handleSignUpClick}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Sign Up
            </Button>

            <div className="relative my-4">
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
              onClick={handleLoginClick}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupRoom;
