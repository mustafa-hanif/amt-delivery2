import { useState } from "react";
import { Lock, User } from "lucide-react";

interface LoginProps {
  onLogin: (password: string, role: 'admin' | 'driver', driverId?: string) => void;
  role: 'admin' | 'driver';
}

export function Login({ onLogin, role }: LoginProps) {
  const [password, setPassword] = useState('');
  const [driverId, setDriverId] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    if (role === 'driver' && !driverId.trim()) {
      setError('Driver ID is required');
      return;
    }

    onLogin(password, role, role === 'driver' ? driverId : undefined);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Lock size={32} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            {role === 'admin' ? 'Admin Login' : 'Driver Login'}
          </h1>
          <p className="text-gray-500 mt-2">
            Enter your credentials to access the {role === 'admin' ? 'admin dashboard' : 'driver view'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {role === 'driver' && (
            <div>
              <label htmlFor="driverId" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={20} className="text-gray-400" />
                </div>
                <input
                  id="driverId"
                  type="text"
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your phone number"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Use your registered phone number</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={20} className="text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Login
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          {role === 'admin' ? (
            <p>Default password: <code className="bg-gray-100 px-2 py-1 rounded">admin123</code></p>
          ) : (
            <p>Ask your admin for your password or check the Drivers list in admin panel</p>
          )}
        </div>
      </div>
    </div>
  );
}
