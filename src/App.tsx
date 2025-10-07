import { useState } from "react";
import { Smartphone, Monitor } from "lucide-react";
import { DeliveryList } from "./components/DeliveryList";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import "./index.css";

type ViewMode = 'delivery' | 'admin';

export function App() {
  const [currentView, setCurrentView] = useState<ViewMode>('delivery');

  return (
    <div className="app">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-gray-900">Delivery Management</h1>
              <div className="flex rounded-lg bg-gray-100 p-1">
                <button
                  onClick={() => setCurrentView('delivery')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                    currentView === 'delivery'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Smartphone size={16} /> Driver View
                </button>
                <button
                  onClick={() => setCurrentView('admin')}
                  className={`px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
                    currentView === 'admin'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Monitor size={16} /> Admin Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={currentView === 'admin' ? '' : 'mx-auto'}>
        {currentView === 'delivery' && <DeliveryList />}
        {currentView === 'admin' && <AdminDashboard />}
      </div>
    </div>
  );
}

export default App;
