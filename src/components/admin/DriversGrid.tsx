import { useState } from "react";
import { Plus, Edit2, X, Check, Loader2, Car, Bike, Star, Truck } from 'lucide-react';
import type { Driver } from "../../types";

interface DriversGridProps {
  drivers: Driver[];
  loading?: boolean;
  onCreateDriver?: (driverData: Omit<Driver, '_id' | 'createdAt' | 'updatedAt' | 'isActive' | 'rating' | 'totalDeliveries' | 'currentLatitude' | 'currentLongitude'>) => Promise<boolean>;
  onUpdateDriver?: (driverId: string, driverData: Omit<Driver, '_id' | 'createdAt' | 'updatedAt' | 'totalDeliveries' | 'currentLatitude' | 'currentLongitude'>) => Promise<boolean>;
}

interface NewDriverRow {
  name: string;
  phone: string;
  vehicleType: 'car' | 'bike' | 'scooter' | 'van';
  licenseNumber: string;
  password: string;
  areaCoverage: string;
}

export function DriversGrid({ drivers, loading, onCreateDriver, onUpdateDriver }: DriversGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Driver>>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newDriver, setNewDriver] = useState<NewDriverRow>({
    name: '',
    phone: '',
    vehicleType: 'car',
    licenseNumber: '',
    password: '',
    areaCoverage: ''
  });
  const [saving, setSaving] = useState(false);

  const startEdit = (driver: Driver) => {
    setEditingId(driver._id);
    setEditingData({ ...driver });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !saving) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const saveEdit = async () => {
    if (!editingId || !onUpdateDriver) return;
    
    setSaving(true);
    const success = await onUpdateDriver(editingId, {
      name: editingData.name!,
      phone: editingData.phone!,
      vehicleType: editingData.vehicleType!,
      licenseNumber: editingData.licenseNumber,
      password: editingData.password,
      areaCoverage: editingData.areaCoverage,
      isActive: editingData.isActive!,
      rating: editingData.rating,
    });

    if (success) {
      setEditingId(null);
      setEditingData({});
    }
    setSaving(false);
  };

  const startNewDriver = () => {
    setShowNewRow(true);
    setNewDriver({
      name: '',
      phone: '',
      vehicleType: 'car',
      licenseNumber: '',
      password: '',
      areaCoverage: ''
    });
  };

  const cancelNewDriver = () => {
    setShowNewRow(false);
    setNewDriver({
      name: '',
      phone: '',
      vehicleType: 'car',
      licenseNumber: '',
      password: '',
      areaCoverage: ''
    });
  };

  const saveNewDriver = async () => {
    if (!onCreateDriver) return;
    
    // Basic validation
    if (!newDriver.name.trim() || !newDriver.phone.trim()) {
      alert('Name and phone are required');
      return;
    }

    setSaving(true);
    const success = await onCreateDriver({
      name: newDriver.name.trim(),
      phone: newDriver.phone.trim(),
      vehicleType: newDriver.vehicleType,
      licenseNumber: newDriver.licenseNumber.trim() || undefined,
      password: newDriver.password.trim() || undefined,
      areaCoverage: newDriver.areaCoverage.trim() || undefined,
    });

    if (success) {
      cancelNewDriver();
    }
    setSaving(false);
  };

  const getVehicleIcon = (vehicleType: string) => {
    switch (vehicleType) {
      case 'car': return <Car size={12} />;
      case 'bike': return <Bike size={12} />;
      case 'scooter': return <Bike size={12} />;
      case 'van': return <Truck size={12} />;
      default: return <Car size={12} />;
    }
  };

  const getVehicleColor = (vehicleType: string) => {
    switch (vehicleType) {
      case 'car': return 'bg-blue-100 text-blue-800';
      case 'bike': return 'bg-green-100 text-green-800';
      case 'scooter': return 'bg-yellow-100 text-yellow-800';
      case 'van': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Drivers</h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
        <div className="text-center py-8 text-gray-500">Loading drivers...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Drivers</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{drivers.length} total</span>
            {!showNewRow && onCreateDriver && (
              <button
                onClick={startNewDriver}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={18} /> Add New Row
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Info
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vehicle Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Area Coverage
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rating
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Existing drivers */}
            {drivers.map((driver) => {
              const isEditing = editingId === driver._id;
              return (
                <tr key={driver._id} className={`${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  {/* Name */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.name || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Driver name"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{driver.name}</div>
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editingData.phone || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, phone: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Phone"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{driver.phone}</div>
                    )}
                  </td>

                  {/* Login Info */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.password || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, password: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Password"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-xs bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="font-medium text-gray-700">ID: {driver.phone}</div>
                        <div className="text-gray-600">PW: {driver.password || '****'}</div>
                      </div>
                    )}
                  </td>

                  {/* Vehicle Type */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editingData.vehicleType || 'car'}
                        onChange={(e) => setEditingData(prev => ({ ...prev, vehicleType: e.target.value as any }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={saving}
                      >
                        <option value="car">Car</option>
                        <option value="bike">Bike</option>
                        <option value="scooter">Scooter</option>
                        <option value="van">Van</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getVehicleColor(driver.vehicleType)}`}>
                        {getVehicleIcon(driver.vehicleType)} {driver.vehicleType.charAt(0).toUpperCase() + driver.vehicleType.slice(1)}
                      </span>
                    )}
                  </td>

                  {/* Area Coverage */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.areaCoverage || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, areaCoverage: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="City/Region"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{driver.areaCoverage || '-'}</div>
                    )}
                  </td>

                  {/* License */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.licenseNumber || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, licenseNumber: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="License (optional)"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{driver.licenseNumber || '-'}</div>
                    )}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editingData.isActive ? 'true' : 'false'}
                        onChange={(e) => setEditingData(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={saving}
                      >
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        driver.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {driver.isActive ? 'Active' : 'Inactive'}
                      </span>
                    )}
                  </td>

                  {/* Rating */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={editingData.rating || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, rating: parseFloat(e.target.value) || undefined }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0-5"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-gray-900 flex items-center gap-1">
                        {driver.rating ? <><Star size={12} className="fill-yellow-400 text-yellow-400" /> {driver.rating.toFixed(1)}</> : 'No rating'}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3 text-right">
                    {isEditing ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="text-green-600 hover:text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          title="Save"
                        >
                          {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="text-red-600 hover:text-red-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(driver)}
                          className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* New driver row */}
            {showNewRow && (
              <tr className="bg-green-50 border-2 border-green-200">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newDriver.name}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Driver name *"
                    disabled={saving}
                    autoFocus
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="tel"
                    value={newDriver.phone}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Phone *"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newDriver.password}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Password (last 4 of phone if blank)"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={newDriver.vehicleType}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, vehicleType: e.target.value as any }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={saving}
                  >
                    <option value="car">Car</option>
                    <option value="bike">Bike</option>
                    <option value="scooter">Scooter</option>
                    <option value="van">Van</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newDriver.areaCoverage}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, areaCoverage: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="City/Region"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newDriver.licenseNumber}
                    onChange={(e) => setNewDriver(prev => ({ ...prev, licenseNumber: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="License (optional)"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-sm">
                  Active
                </td>
                <td className="px-4 py-3 text-center text-gray-400 text-sm">
                  New
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={saveNewDriver}
                      disabled={saving}
                      className="text-green-600 hover:text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      title="Save New Driver"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={cancelNewDriver}
                      disabled={saving}
                      className="text-red-600 hover:text-red-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            )}

            {/* Empty state */}
            {drivers.length === 0 && !showNewRow && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  No drivers found. Click "Add New Row" to create your first driver.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}