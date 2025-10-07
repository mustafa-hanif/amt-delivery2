import { useState, useEffect } from "react";
import { Car, Bike, Truck, Star, Package } from 'lucide-react';
import type { Driver, Customer } from "../../types";

interface DriverAssignmentModalProps {
  customer: Customer;
  drivers: Driver[];
  productInfo?: { id: string; name: string; price: number; category?: string };
  onAssign: (driverId: string, priority: 'low' | 'medium' | 'high' | 'urgent', notes?: string) => Promise<boolean>;
  onCancel: () => void;
}

export function DriverAssignmentModal({ customer, drivers, productInfo, onAssign, onCancel }: DriverAssignmentModalProps) {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const activeDrivers = drivers.filter(d => d.isActive);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedDriver) {
      return;
    }

    setLoading(true);
    
    try {
      const success = await onAssign(
        selectedDriver, 
        priority, 
        notes || undefined
      );

      if (success) {
        onCancel();
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
    } finally {
      setLoading(false);
    }
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'car': return <Car size={20} />;
      case 'bike': return <Bike size={20} />;
      case 'scooter': return <Bike size={20} />;
      case 'van': return <Truck size={20} />;
      default: return <Car size={20} />;
    }
  };

  const getPriorityColor = (level: string) => {
    switch (level) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Assign Delivery to Driver
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Customer Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Name:</span> {customer.name}</p>
              <p><span className="font-medium">Phone:</span> {customer.phone}</p>
              <p><span className="font-medium">Address:</span> {customer.address}</p>
              {(customer.city || customer.country) && (
                <p><span className="font-medium">Location:</span> {[customer.city, customer.country].filter(Boolean).join(', ')}</p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Driver Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Driver *
              </label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {activeDrivers.length === 0 ? (
                  <p className="text-gray-500 text-sm">No active drivers available</p>
                ) : (
                  activeDrivers.map((driver) => (
                    <label
                      key={driver._id}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedDriver === driver._id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="driver"
                        value={driver._id}
                        checked={selectedDriver === driver._id}
                        onChange={(e) => setSelectedDriver(e.target.value)}
                        className="sr-only"
                      />
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <div className="mr-3">{getVehicleIcon(driver.vehicleType)}</div>
                          <div>
                            <div className="font-medium text-gray-900">{driver.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              {driver.vehicleType} • <Star size={12} className="fill-yellow-400 text-yellow-400" /> {driver.rating?.toFixed(1) || 'N/A'} • {driver.totalDeliveries || 0} deliveries
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{driver.phone}</div>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </div>

            {/* Product Info (Read-only) */}
            {productInfo && (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={18} className="text-blue-600" />
                  <h3 className="text-sm font-semibold text-gray-800">Product Details</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{productInfo.name}</div>
                      {productInfo.category && (
                        <div className="text-xs text-gray-500 mt-1">{productInfo.category}</div>
                      )}
                    </div>
                    <div className="text-lg font-bold text-green-600">
                      AED {productInfo.price.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Priority Level
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['low', 'medium', 'high', 'urgent'] as const).map((level) => (
                  <label
                    key={level}
                    className={`flex items-center justify-center p-3 border rounded-lg cursor-pointer transition-colors ${
                      priority === level
                        ? getPriorityColor(level)
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="priority"
                      value={level}
                      checked={priority === level}
                      onChange={(e) => setPriority(e.target.value as any)}
                      className="sr-only"
                    />
                    <span className="font-medium capitalize">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Special instructions, access codes, etc."
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !selectedDriver}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-md font-medium transition-colors flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Assigning Driver...
                  </>
                ) : (
                  'Assign Driver'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}