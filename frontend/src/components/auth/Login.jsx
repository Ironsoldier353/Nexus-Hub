import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, User, Loader2, Mail, Users, Shield, BadgeCheck, AlertCircle, CheckCircle } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { login } from '@/redux/authSlice';
import { toast, Toaster } from 'sonner';
import { LOGIN_ADMIN_API, FORGOT_USERNAME_API } from '@/utils/constants';
import logo from '../../assets/logo.webp';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('admin');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotUsernameLoading, setForgotUsernameLoading] = useState(false);
  const [showForgotUsername, setShowForgotUsername] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await axios.post(
        `${LOGIN_ADMIN_API}`,
        { username, password },
        { withCredentials: true }
      );

      const user = res.data.user;

      if (res.data.success) {
        dispatch(login(user));

        // Enhanced success toast
        toast.success(res.data.message || 'Login successful!', {
          duration: 4000,
          position: "top-center",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          description: "Redirecting to dashboard...",
          className: "border-l-4 border-green-500 bg-white",
          style: {
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }
        });
      }

      if (!user.room) {
        toast.error('Room not found for the admin', {
          duration: 5000,
          position: "top-center",
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          description: "Please contact support for assistance",
          className: "border-l-4 border-red-500 bg-white",
          style: {
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }
        });
        setLoading(false);
        return;
      }

      setTimeout(() => {
        navigate(`/admin/dashboard/${user.room}`);
      }, 1500);
    } catch (error) {
      const errorDetail = error.response?.data?.detail || '';

      // Enhanced error toast
      toast.error(error.response?.data?.message || 'Invalid credentials', {
        duration: 5000,
        position: "top-center",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        description: errorDetail || 'Please check your username and password',
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss()
        },
        className: "border-l-4 border-red-500 bg-white",
        style: {
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotUsername = async (e) => {
    e.preventDefault();
    setForgotUsernameLoading(true);

    try {
      const res = await axios.post(`${FORGOT_USERNAME_API}`, {
        email,
        role,
        securityQuestion,
        securityAnswer,
      });

      if (res.data.success) {
        // Enhanced success toast for username retrieval
        toast.success('Username Retrieved!', {
          duration: 4000,
          position: "top-center",
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          description: `Your username is: ${res.data.username}`,
          className: "border-l-4 border-green-500 bg-white",
          style: {
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }
        });
      } else {
        toast.error(res.data.message || 'Failed to retrieve username', {
          duration: 5000,
          position: "top-center",
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          description: "Please check your information and try again",
          className: "border-l-4 border-red-500 bg-white",
          style: {
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }
        });
      }
    } catch (error) {
      const errorDetail = error.response?.data?.detail || '';

      toast.error(error.response?.data?.message || 'Error retrieving username', {
        duration: 5000,
        position: "top-center",
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        description: errorDetail || "Please verify your information and try again",
        action: {
          label: 'Dismiss',
          onClick: () => toast.dismiss()
        },
        className: "border-l-4 border-red-500 bg-white",
        style: {
          padding: '16px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }
      });
    } finally {
      setForgotUsernameLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-r from-blue-600 to-blue-700">
      {/* Toaster component for toast notifications */}
      <Toaster position="top-center" />

      <div className="w-full flex items-center p-4 bg-blue-800">
        <Link to="/" className="flex items-center gap-2 ml-4">
          <img src={logo} alt="LumenHive Logo" className="h-10 w-auto" />
          <span className="font-bold text-2xl text-white">LumenHive</span>
        </Link>
      </div>

      <div className="flex items-center justify-center flex-grow">
        <Card className="w-96 shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">
              Welcome Admin
            </CardTitle>
            <CardDescription className="text-center">
              Check your registered email for credentials
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showForgotUsername ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="pl-9"
                      placeholder="Enter your username"
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
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </Button>

                <div className="mt-4 text-center space-y-2">
                  <Button
                    variant="link"
                    className="font-medium"
                    onClick={() => setShowForgotUsername(true)}
                  >
                    Forgot Username?
                  </Button>

                  <div className="mt-2">
                    <p className="text-l text-muted-foreground">Not registered yet?</p>
                    <Button
                      variant="link"
                      className="font-medium"
                      onClick={() => navigate('/signup')}
                    >
                      Register Here!
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={handleForgotUsername} className="space-y-4">
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
                  <Label htmlFor="role">Role</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <select
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring focus:ring-blue-300"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityQuestion">Security Question</Label>
                  <div className="relative">
                    <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <select
                      id="securityQuestion"
                      value={securityQuestion}
                      onChange={(e) => setSecurityQuestion(e.target.value)}
                      required
                      className="pl-9 w-full border rounded-lg py-2"
                    >
                      <option value="" disabled>Select a security question</option>
                      <option value="What is your favorite color?">What is your favorite color?</option>
                      <option value="What was the name of your first pet?">What was the name of your first pet?</option>
                      <option value="What is your mother's maiden name?">What is your mother&apos;s maiden name?</option>
                      <option value="What was the name of the street you grew up on?">What was the name of the street you grew up on?</option>
                      <option value="What is your favorite book or movie?">What is your favorite book or movie?</option>
                      <option value="What was the make and model of your first car?">What was the make and model of your first car?</option>
                      <option value="What is your childhood nickname?">What is your childhood nickname?</option>
                      <option value="In what city were you born?">In what city were you born?</option>
                      <option value="What is your mother's middle name?">What is your mother&apos;s middle name?</option>
                      <option value="What was the name of your elementary school?">What was the name of your elementary school?</option>
                      <option value="What is the name of your best friend from childhood?">What is the name of your best friend from childhood?</option>
                      <option value="What was the name of your first teacher?">What was the name of your first teacher?</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="securityAnswer">Security Answer</Label>
                  <div className="relative">
                    <BadgeCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="securityAnswer"
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      required
                      className="pl-9"
                      placeholder="Enter your answer in one word. e.g. Blue"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={forgotUsernameLoading}
                >
                  {forgotUsernameLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Retrieving username...
                    </>
                  ) : (
                    'Retrieve Username'
                  )}
                </Button>

                <div className="mt-4 text-center">
                  <Button
                    variant="link"
                    className="font-medium"
                    onClick={() => setShowForgotUsername(false)}
                  >
                    Back to Login
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;