import { useState } from "react";
import { Plus, Edit2, X, Check, Loader2, Car, Bike, Star, Truck, Download } from 'lucide-react';
import type { Driver, Delivery } from "../../types";

interface DriversGridProps {
  drivers: Driver[];
  orders?: Delivery[]; // Add orders prop
  loading?: boolean;
  onCreateDriver?: (driverData: Omit<Driver, '_id' | 'createdAt' | 'updatedAt' | 'isActive' | 'rating' | 'totalDeliveries' | 'currentLatitude' | 'currentLongitude'>) => Promise<boolean>;
  onUpdateDriver?: (driverId: string, driverData: Omit<Driver, '_id' | 'createdAt' | 'updatedAt' | 'totalDeliveries' | 'currentLatitude' | 'currentLongitude'>) => Promise<boolean>;
  onUpdateOrder?: (orderId: string, orderData: {
    status: 'Pending' | 'On Way' | 'Delivered' | 'No Answer' | 'Cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deliveryTime?: string;
    notes?: string;
    productId?: string;
    driverId?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;
}

interface NewDriverRow {
  name: string;
  phone: string;
  vehicleType: 'car' | 'bike' | 'scooter' | 'van';
  licenseNumber: string;
  password: string;
  areaCoverage: string;
}

export function DriversGrid({ drivers, orders = [], loading, onCreateDriver, onUpdateDriver, onUpdateOrder }: DriversGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Driver>>({});
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
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

  // Get orders for selected driver
  const selectedDriver = selectedDriverId ? drivers.find(d => d._id === selectedDriverId) : null;
  const driverOrders = selectedDriverId 
    ? orders.filter(order => order.driverId === selectedDriverId)
    : [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'On Way': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'No Answer': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleOrderStatusChange = async (orderId: string, newStatus: Delivery['status'], order: Delivery) => {
    if (!onUpdateOrder) return;
    
    const success = await onUpdateOrder(orderId, {
      status: newStatus,
      priority: order.priority,
      deliveryTime: order.deliveryTime,
      notes: order.notes,
      productId: order.productId,
      driverId: order.driverId,
      latitude: order.latitude,
      longitude: order.longitude,
    });

    if (success) {
      setEditingOrderId(null);
    } else {
      alert('Failed to update order status. Please try again.');
    }
  };

  const downloadDriverOrders = (driver: Driver, orders: Delivery[]) => {
    // Define CSV headers
    const headers = [
      'Order ID',
      'Customer Name',
      'Phone',
      'Address',
      'City',
      'Product',
      'Price (AED)',
      'Status',
      'Delivery Option',
      'Priority',
      'Notes',
      'Latitude',
      'Longitude',
      'Created At'
    ];

    // Map orders to CSV rows
    const rows = orders.map(order => [
      order._id,
      order.customerName,
      order.customerPhone,
      order.customerAddress || '',
      order.customerCity || '',
      order.product ? (order.product.title || order.product.name) : '',
      (order.orderValue || (order.product?.raw as any)?.price || 0).toFixed(2),
      order.status,
      order.deliveryTime === 'today' ? 'Today' :
        order.deliveryTime === 'tomorrow' ? 'Tomorrow' :
        order.deliveryTime === '2-days' ? '2 Days After' :
        order.deliveryTime || '',
      order.priority,
      order.notes || '',
      order.latitude || '',
      order.longitude || '',
      new Date(order.createdAt).toLocaleString()
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas, quotes, or newlines
        const cellStr = String(cell);
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `${driver.name}_orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex gap-6">
      {/* Drivers Table */}
      <div className={`bg-white rounded-lg shadow-sm border ${selectedDriverId ? 'w-1/2' : 'w-full'} transition-all duration-300`}>
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
                Total Orders
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
              const isSelected = selectedDriverId === driver._id;
              return (
                <tr 
                  key={driver._id} 
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-100 border-l-4 border-l-blue-500' : 
                    isEditing ? 'bg-blue-50' : 
                    'hover:bg-gray-50'
                  }`}
                  onClick={() => !isEditing && setSelectedDriverId(driver._id)}
                >
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

                  {/* Total Orders */}
                  <td className="px-4 py-3">
                    <div className="text-sm font-semibold text-gray-900">
                      {orders.filter(order => order.driverId === driver._id).length}
                    </div>
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
                <td className="px-4 py-3 text-center text-gray-400 text-sm">
                  0
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
                <td colSpan={10} className="px-6 py-8 text-center text-gray-500">
                  No drivers found. Click "Add New Row" to create your first driver.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>

      {/* Driver Orders Table - Shows when a driver is selected */}
      {selectedDriverId && selectedDriver && (
        <div className="w-1/2 bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{selectedDriver.name}'s Orders</h3>
                <p className="text-sm text-gray-500 mt-1">{driverOrders.length} total orders</p>
              </div>
              <div className="flex items-center gap-2">
                {driverOrders.length > 0 && (
                  <button
                    onClick={() => downloadDriverOrders(selectedDriver, driverOrders)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                    title="Download orders as CSV"
                  >
                    <Download size={16} /> Download CSV
                  </button>
                )}
                <button
                  onClick={() => setSelectedDriverId(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  title="Close"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {driverOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No orders assigned to this driver yet.
                    </td>
                  </tr>
                ) : (
                  driverOrders.map((order) => (
                    <tr key={order._id} className="hover:bg-gray-50">
                      {/* Customer */}
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerPhone}</div>
                        <div className="text-xs text-gray-500 mt-1">{order.customerAddress}</div>
                      </td>
                      
                      {/* Product */}
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900">
                          {order.product ? (order.product.title || order.product.name) : 'N/A'}
                        </div>
                      </td>
                      
                      {/* Status */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {editingOrderId === order._id ? (
                          <select
                            value={order.status}
                            onChange={(e) => handleOrderStatusChange(order._id, e.target.value as Delivery['status'], order)}
                            className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onBlur={() => setEditingOrderId(null)}
                          >
                            <option value="Pending">Pending</option>
                            <option value="On Way">On Way</option>
                            <option value="Delivered">Delivered</option>
                            <option value="No Answer">No Answer</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        ) : (
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:opacity-80 ${getStatusColor(order.status)}`}
                            onClick={() => setEditingOrderId(order._id)}
                            title="Click to change status"
                          >
                            {order.status}
                          </span>
                        )}
                      </td>
                      
                      {/* Delivery Time */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          order.deliveryTime === 'today' ? 'bg-red-100 text-red-800' :
                          order.deliveryTime === 'tomorrow' ? 'bg-yellow-100 text-yellow-800' :
                          order.deliveryTime === '2-days' ? 'bg-green-100 text-green-800' :
                          order.deliveryTime ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {order.deliveryTime === 'today' ? 'Today' :
                           order.deliveryTime === 'tomorrow' ? 'Tomorrow' :
                           order.deliveryTime === '2-days' ? '2 Days' :
                           order.deliveryTime || 'Not Set'}
                        </span>
                      </td>
                      
                      {/* Price */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          AED {(order.orderValue || (order.product?.raw as any)?.price || 0).toFixed(2)}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}