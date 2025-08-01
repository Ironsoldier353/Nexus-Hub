import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Key, Loader2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { ADD_MEMBER_API } from "@/utils/constants";

const JoinMember = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(`${ADD_MEMBER_API}`, {
        email,
        password,
        inviteCode,
      });

      if (response.data.success) {
        setMessage(response.data.message);

        setEmail("");
        setPassword("");
        setInviteCode("");
        toast.success(response.data.message);
      }
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong.");
      toast.error(error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
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
          <CardTitle className="text-2xl font-bold text-center">Join as Member</CardTitle>
          <CardDescription className="text-center">Enter your details to join a room</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-9"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-9"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="inviteCode"
                  type="text"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  className="pl-9"
                  placeholder="Enter invite code"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding Member...
                </>
              ) : (
                "Join Room"
              )}
            </Button>
          </form>

          {message && (
            <div
              className={`mt-4 text-sm font-medium ${message.includes("success") ? "text-green-500" : "text-red-500"
                }`}
            >
              {message}
            </div>
          )}

          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">Already joined?</p>
            <Button
              variant="link"
              className="font-medium text-blue-700"
              onClick={() => (window.location.href = "/add-member/login")}
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JoinMember;
