
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserPlus, LogIn } from "lucide-react";

const AddMember = () => {
  const handleJoinRoom = () => {
    window.location.href = "/add-member/join";
  };

  const handleLogin = () => {
    window.location.href = "/add-member/login";
  };

  const handleHomeClick = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 relative">
      {/* Top-right Go to Home Button */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          className="text-white hover:text-gray-200 hover:bg-gray-700 px-4 py-2 rounded transition-all duration-200 ease-in-out"
          onClick={handleHomeClick}
        >
          Go to Home
        </Button>
      </div>

      {/* Main Card */}
      <Card className="w-96 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Member Access
          </CardTitle>
          <CardDescription className="text-center">
            Join a room or login to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <Button 
            className="w-full h-11 text-base font-medium"
            onClick={handleJoinRoom}
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Join Room
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
            onClick={handleLogin}
          >
            <LogIn className="w-5 h-5 mr-2" />
            Login
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddMember;
