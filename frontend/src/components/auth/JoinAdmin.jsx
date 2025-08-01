import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { User, Search, ArrowRight, Building } from "lucide-react";
import axios from "axios";
import { GET_ROOM_ID_BY_USERNAME_API } from "@/utils/constants";

const JoinAdmin = () => {
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState(null);
  const [roomFound, setRoomFound] = useState(null); // Track room found status
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFindRoom = async () => {
    if (!username.trim()) {
      toast({ description: "Username is required.", variant: "destructive" });
      return;
    }

    try {
      const response = await axios.post(
        `${GET_ROOM_ID_BY_USERNAME_API}`,
        { username }
      );
      const data = response.data;

      if (data.roomId) {
        setRoomId(data.roomId);
        setRoomFound(true); // Room found
        toast({ description: "Room ID fetched successfully.", variant: "success" });
      } else {
        setRoomFound(false); // No room found
        setRoomId(null);
      }
    } catch (error) {
      toast({
        description: error.message || "An error occurred",
        variant: "destructive",
      });
      setRoomFound(false); // Error handling, set roomFound to false
      setRoomId(null);
    }
  };

  const handleRegister = () => {
    if (roomId) {
      navigate(`/add-admin/register`);
    }
  };

  const handleHomeClick = () => {
    navigate("/");
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

      <Card className="w-96 shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Find Your Room</CardTitle>
          <CardDescription className="text-center">
            Enter your username to find your associated room
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Enter Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="pl-9"
                aria-label="Username"
              />
            </div>
          </div>

          <Button onClick={handleFindRoom} className="w-full">
            <Search className="mr-2 h-4 w-4" />
            Find Room
          </Button>

          {/* If room is found */}
          {roomFound === true && roomId && (
            <Card className="mt-4 border border-green-100 bg-green-50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center space-x-2 text-green-700">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">Room Found!</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-green-200">
                  <p className="text-sm text-muted-foreground mb-1">Room ID</p>
                  <p className="font-medium">{roomId}</p>
                </div>

                <Button
                  onClick={handleRegister}
                  className="w-full"
                  variant="default"
                >
                  Continue to Registration
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* If no room found */}
          {roomFound === false && (
            <Card className="mt-4 border border-red-100 bg-red-50">
              <CardContent className="pt-6 space-y-4">
                <div className="flex items-center space-x-2 text-red-700">
                  <Building className="h-4 w-4" />
                  <span className="font-medium">No Room Found!</span>
                </div>

                <div className="p-3 bg-white rounded-lg border border-red-200">
                  <p className="text-sm text-muted-foreground mb-1">
                    No room associated with this username.
                  </p>
                </div>

                <Button disabled className="w-full" variant="outline">
                  No Room Available
                </Button>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinAdmin;
