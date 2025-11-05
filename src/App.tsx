import { useState, useEffect } from "react";
import { Smartphone, Monitor, LogOut } from "lucide-react";
import { DeliveryList } from "./components/DeliveryList";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { Login } from "./components/Login";
import { adminService } from "./services/adminService";
import "./index.css";

type ViewMode = 'delivery' | 'admin';

interface AuthState {
  isAuthenticated: boolean;
  role: 'admin' | 'driver' | null;
  driverId?: string;
}

export function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('admin');
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    role: null,
  });
  const [showLoginFor, setShowLoginFor] = useState<'admin' | 'driver' | null>(null);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('authState');
    if (savedAuth) {
      const parsed = JSON.parse(savedAuth);
      setAuthState(parsed);
      setCurrentView(parsed.role === 'admin' ? 'admin' : 'delivery');
    }
  }, []);

  const handleLogin = async (password: string, role: 'admin' | 'driver', driverId?: string) => {
    // Simple password check - in production, this should be server-side
    let isValid = false;
    let actualDriverId: string | undefined = undefined;
    
    if (role === 'admin') {
      // Admin password check
      isValid = password === 'admin123';
    } else {
      // Driver password check - validate against driver records
      if (driverId) {
        const drivers = await adminService.getDrivers();
        const driver = drivers.find(d => d.phone === driverId);
        
        if (driver && driver.password === password) {
          isValid = true;
          actualDriverId = driver._id; // Use the actual driver ID, not phone
        }
      }
    }

    if (isValid) {
      const newAuthState: AuthState = {
        isAuthenticated: true,
        role,
        driverId: role === 'driver' ? actualDriverId : undefined,
      };
      setAuthState(newAuthState);
      localStorage.setItem('authState', JSON.stringify(newAuthState));
      setShowLoginFor(null);
      setCurrentView(role === 'admin' ? 'admin' : 'delivery');
    } else {
      alert('Invalid credentials');
    }
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      role: null,
    });
    localStorage.removeItem('authState');
    setShowLoginFor(null);
  };

  const handleViewSwitch = (view: ViewMode) => {
    const targetRole = view === 'admin' ? 'admin' : 'driver';
    
    // If not authenticated or trying to switch to different role, show login
    if (!authState.isAuthenticated || authState.role !== targetRole) {
      setShowLoginFor(targetRole);
    } else {
      setCurrentView(view);
    }
  };

  // Show login screen if requested
  if (showLoginFor) {
    return <Login onLogin={handleLogin} role={showLoginFor} />;
  }

  // Show login prompt if not authenticated
  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Delivery Management
          </h1>
          <p className="text-gray-600 mb-8">
            Select your access level to continue
          </p>
          <div className="space-y-4">
            <button
              onClick={() => setShowLoginFor('admin')}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              <Monitor size={24} />
              Admin Login
            </button>
            <button
              onClick={() => setShowLoginFor('driver')}
              className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-md transition-colors"
            >
              <Smartphone size={24} />
              Driver Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b hidden md:block">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex flex-col items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Delivery Management</h1>
              {authState.role === 'driver' && authState.driverId && (
                <span className="block text-sm text-gray-600">
                  Driver: {authState.driverId}
                </span>
              )}
              {authState.role === 'admin' && (
                <div className="flex rounded-lg bg-gray-100 p-1">
                  <button
                    onClick={() => handleViewSwitch('delivery')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      currentView === 'delivery'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Smartphone size={16} /> Driver View
                  </button>
                  <button
                    onClick={() => handleViewSwitch('admin')}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                      currentView === 'admin'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Monitor size={16} /> Admin Dashboard
                  </button>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-md transition-colors text-sm font-medium"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div>
        {currentView === 'delivery' && <DeliveryList driverId={authState.driverId} />}
        {currentView === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
}

export default App;
