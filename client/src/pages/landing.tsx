import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, User, UserRoundCheck, ArrowRight, ArrowLeft } from "lucide-react";

type AuthStep = 'role-selection' | 'patron-login' | 'staff-login' | 'patron-register';
type UserRole = 'patron' | 'staff';

export default function Landing() {
  const [currentStep, setCurrentStep] = useState<AuthStep>('role-selection');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelection = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'patron') {
      setCurrentStep('patron-login');
    } else {
      setCurrentStep('staff-login');
    }
  };

  const handleLogin = () => {
    // Redirect to Replit Auth
    window.location.href = '/api/login';
  };

  const showRoleSelection = () => {
    setCurrentStep('role-selection');
    setSelectedRole(null);
  };

  const showPatronRegister = () => {
    setCurrentStep('patron-register');
  };

  const showPatronLogin = () => {
    setCurrentStep('patron-login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-full mb-4">
            <BookOpen className="text-white text-2xl" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">LibraryMS</h1>
          <p className="text-gray-600">Professional Library Management System</p>
        </div>

        {/* Role Selection */}
        {currentStep === 'role-selection' && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">Choose Your Access Type</h2>
              
              <div className="space-y-4">
                <Button
                  onClick={() => handleRoleSelection('patron')}
                  className="w-full p-4 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg transition-colors group text-left h-auto"
                  variant="ghost"
                >
                  <div className="flex items-center w-full">
                    <User className="text-primary text-xl mr-4" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Library Patron</h3>
                      <p className="text-sm text-gray-600">Browse books, manage loans, search catalog</p>
                    </div>
                    <ArrowRight className="text-primary ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
                
                <Button
                  onClick={() => handleRoleSelection('staff')}
                  className="w-full p-4 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-200 rounded-lg transition-colors group text-left h-auto"
                  variant="ghost"
                >
                  <div className="flex items-center w-full">
                    <UserRoundCheck className="text-emerald-600 text-xl mr-4" />
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">Library Staff</h3>
                      <p className="text-sm text-gray-600">Manage books, process loans, oversee members</p>
                    </div>
                    <ArrowRight className="text-emerald-600 ml-auto group-hover:translate-x-1 transition-transform" />
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patron Login Form */}
        {currentStep === 'patron-login' && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center mb-6">
                <Button onClick={showRoleSelection} variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Patron Access</h2>
                  <p className="text-sm text-gray-600">Access your library account</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Sign in with your Replit account to access the library system as a patron.
                </p>
                <Button onClick={handleLogin} className="w-full bg-primary hover:bg-blue-700 text-white font-semibold py-3">
                  Sign In with Replit
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  New to the library? Your account will be created automatically when you sign in.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Staff Login Form */}
        {currentStep === 'staff-login' && (
          <Card className="shadow-lg">
            <CardContent className="pt-6">
              <div className="flex items-center mb-6">
                <Button onClick={showRoleSelection} variant="ghost" size="sm" className="mr-4">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Staff Access</h2>
                  <p className="text-sm text-gray-600">Access staff management system</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Sign in with your authorized Replit account to access staff features.
                </p>
                <Button onClick={handleLogin} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3">
                  Sign In with Replit
                </Button>
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Staff access requires proper authorization. Contact your system administrator if you need staff privileges.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
