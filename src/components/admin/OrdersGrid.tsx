import { useState, useEffect } from "react";
import { Edit2, Truck, Plus, X, Check, Loader2, Trash2 } from "lucide-react";
import type { Delivery, Customer, Product, Driver } from "../../types";

// Function to extract lat/lng from Google Maps URL
const extractLocationFromUrl = (url: string): { latitude?: number; longitude?: number } => {
  try {
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/,  // @lat,lng
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/,  // q=lat,lng
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dlat!4dlng
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1] && match[2]) {
        const lat = parseFloat(match[1]);
        const lng = parseFloat(match[2]);
        if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
          return { latitude: lat, longitude: lng };
        }
      }
    }

    return {};
  } catch (error) {
    console.error('Error parsing location URL:', error);
    return {};
  }
};

interface OrdersGridProps {
  orders: Delivery[];
  customers: Customer[];
  products: Product[];
  drivers?: Driver[];
  loading?: boolean;
  onUpdateOrder?: (orderId: string, orderData: { 
    status: 'Pending' | 'On Way' | 'Delivered'; 
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deliveryTime?: 'today' | 'tomorrow' | '2-days';
    notes?: string;
    productId?: string;
    driverId?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;
  onCreateOrder?: (orderData: {
    customerId: string;
    productId: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deliveryTime?: 'today' | 'tomorrow' | '2-days';
    notes?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;
  onDeleteOrder?: (orderId: string) => Promise<boolean>;
  onAssignDriver?: (order: Delivery) => void;
}

export function OrdersGrid({ orders, customers, products, drivers, loading, onUpdateOrder, onCreateOrder, onDeleteOrder, onAssignDriver }: OrdersGridProps) {
  const [localOrders, setLocalOrders] = useState<Delivery[]>(orders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Delivery>>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    productId: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    deliveryTime: '' as '' | 'today' | 'tomorrow' | '2-days',
    notes: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
  });
  const [saving, setSaving] = useState(false);
  const [showMagicBox, setShowMagicBox] = useState(false);
  const [magicBoxData, setMagicBoxData] = useState('');
  const [parsedOrders, setParsedOrders] = useState<Array<{
    customerName: string;
    customerPhone: string;
    productName: string;
    notes?: string;
  }>>([]);

  // Update local orders when props change
  useEffect(() => {
    setLocalOrders(orders);
  }, [orders]);

  const startEdit = (order: Delivery) => {
    setEditingId(order._id);
    setEditingData({ ...order });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const parseMagicBoxData = (data: string) => {
    const lines = data.trim().split('\n').filter(line => line.trim());
    const parsed: Array<{
      customerName: string;
      customerPhone: string;
      productName: string;
      notes?: string;
    }> = [];

    for (const line of lines) {
      const columns = line.split('\t'); // Excel uses tabs
      
      // Handle flexible column formats
      if (columns.length >= 2) {
        // Try to identify phone number (starts with digits, longer than 7 chars)
        const phoneIndex = columns.findIndex(col => {
          const trimmed = col.trim();
          return /^\d{7,}$/.test(trimmed);
        });
        
        // Last column is usually the product
        const productName = columns[columns.length - 1]?.trim() || '';
        const customerName = columns[0]?.trim() || '';
        const customerPhone = phoneIndex >= 0 ? columns[phoneIndex]?.trim() || '' : '';
        
        // Everything between name and phone/product can be notes (address, etc)
        const notes = columns.slice(1, phoneIndex >= 0 ? phoneIndex : columns.length - 1)
          .map(c => c.trim())
          .filter(c => c)
          .join(' ');

        parsed.push({
          customerName,
          customerPhone,
          productName,
          notes: notes || undefined,
        });
      }
    }

    return parsed;
  };

  const handleMagicBoxPaste = (e: React.ClipboardEvent) => {
    e.preventDefault(); // Prevent default paste to avoid duplication
    const pastedData = e.clipboardData.getData('text');
    setMagicBoxData(pastedData);
    const parsed = parseMagicBoxData(pastedData);
    setParsedOrders(parsed);
  };

  const importMagicBoxOrders = async () => {
    if (!onCreateOrder || parsedOrders.length === 0) return;

    setSaving(true);
    let successCount = 0;
    
    for (const order of parsedOrders) {
      // Find matching customer by name or phone
      const customer = customers.find(c => 
        c.name.toLowerCase() === order.customerName.toLowerCase() ||
        c.phone === order.customerPhone
      );
      
      // Find matching product by name
      const product = products.find(p => 
        p.title.toLowerCase().includes(order.productName.toLowerCase())
      );

      if (customer && product) {
        const success = await onCreateOrder({
          customerId: customer._id,
          productId: product._id,
          priority: 'medium',
          notes: order.notes,
          latitude: undefined,
          longitude: undefined,
        });
        
        if (success) successCount++;
      }
    }

    setSaving(false);
    setShowMagicBox(false);
    setMagicBoxData('');
    setParsedOrders([]);
    
    alert(`Successfully imported ${successCount} out of ${parsedOrders.length} orders!`);
  };

  const handleLocationPaste = (e: React.ClipboardEvent, isEditing: boolean) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if it looks like a Google Maps URL
    if (pastedText.includes('google.com/maps') || pastedText.includes('goo.gl/maps') || pastedText.includes('maps.app.goo.gl')) {
      e.preventDefault();
      const location = extractLocationFromUrl(pastedText);
      
      if (location.latitude && location.longitude) {
        if (isEditing) {
          setEditingData(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        } else {
          setNewOrder(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        }
      }
    }
  };

  const saveEdit = async () => {
    if (!editingId || !onUpdateOrder) return;
    
    setSaving(true);
    
    // Optimistically update the local state
    setLocalOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === editingId 
          ? { ...order, ...editingData } 
          : order
      )
    );
    
    const success = await onUpdateOrder(editingId, {
      status: editingData.status!,
      priority: editingData.priority!,
      deliveryTime: editingData.deliveryTime,
      notes: editingData.notes,
      productId: editingData.productId,
      driverId: editingData.driverId,
      latitude: editingData.latitude,
      longitude: editingData.longitude,
    });

    if (success) {
      setEditingId(null);
      setEditingData({});
    } else {
      // Revert on failure
      setLocalOrders(orders);
    }
    setSaving(false);
  };

  const handleDeleteOrder = async (orderId: string, customerName: string) => {
    if (!onDeleteOrder) return;
    
    const confirmed = window.confirm(`Are you sure you want to delete the order for ${customerName}? This action cannot be undone.`);
    if (!confirmed) return;
    
    // Optimistically remove from UI
    setLocalOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
    
    const success = await onDeleteOrder(orderId);
    
    if (!success) {
      // Revert on failure
      setLocalOrders(orders);
      alert('Failed to delete order. Please try again.');
    }
  };

  const startNewOrder = () => {
    setShowNewRow(true);
    setNewOrder({
      customerId: '',
      productId: '',
      priority: 'medium',
      deliveryTime: '',
      notes: '',
      latitude: undefined,
      longitude: undefined,
    });
  };

  const cancelNewOrder = () => {
    setShowNewRow(false);
    setNewOrder({
      customerId: '',
      productId: '',
      priority: 'medium',
      deliveryTime: '',
      notes: '',
      latitude: undefined,
      longitude: undefined,
    });
  };

  const saveNewOrder = async () => {
    if (!onCreateOrder) return;
    
    // Basic validation
    if (!newOrder.customerId || !newOrder.productId) {
      alert('Customer and Product are required');
      return;
    }

    setSaving(true);
    const success = await onCreateOrder({
      customerId: newOrder.customerId,
      productId: newOrder.productId,
      priority: newOrder.priority,
      deliveryTime: newOrder.deliveryTime || undefined,
      notes: newOrder.notes || undefined,
      latitude: newOrder.latitude,
      longitude: newOrder.longitude,
    });

    if (success) {
      cancelNewOrder();
    }
    setSaving(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'On Way': return 'bg-blue-100 text-blue-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Orders</h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
        <div className="text-center py-8 text-gray-500">Loading orders...</div>
      </div>
    );
  }

  // Sort orders by creation time (latest first)
  const sortedOrders = [...localOrders].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA; // Descending order (newest first)
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Orders</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{orders.length} total</span>
            <button
              onClick={() => setShowMagicBox(!showMagicBox)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Magic Box
            </button>
            {!showNewRow && onCreateOrder && (
              <button
                onClick={startNewOrder}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Plus size={18} /> Add New Row
              </button>
            )}
          </div>
        </div>
        
        {/* Magic Box Section */}
        {showMagicBox && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="mb-3">
              <h4 className="font-semibold text-purple-800 mb-1">Bulk Import Orders from Excel</h4>
              <p className="text-sm text-purple-600">
                Paste Excel data. Smart detection finds: <strong>Customer Name (first) | Phone (digits) | Product (last)</strong>
              </p>
              <p className="text-xs text-purple-500 mt-1">
                Example: YOUNUS | Barwa road Doha | QATAR | 97430837436 | YAMANI KHALTA
              </p>
            </div>
            
            <textarea
              value={magicBoxData}
              onChange={(e) => setMagicBoxData(e.target.value)}
              onPaste={handleMagicBoxPaste}
              placeholder="Paste your Excel data here (tab-separated)..."
              className="w-full h-32 p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            {parsedOrders.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-purple-700 mb-2">
                  Preview: {parsedOrders.length} orders detected
                </p>
                <div className="max-h-48 overflow-y-auto bg-white border border-purple-200 rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-purple-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-purple-800">Customer</th>
                        <th className="px-3 py-2 text-left text-purple-800">Phone</th>
                        <th className="px-3 py-2 text-left text-purple-800">Product</th>
                        <th className="px-3 py-2 text-left text-purple-800">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedOrders.map((order, idx) => (
                        <tr key={idx} className="border-t border-purple-100">
                          <td className="px-3 py-2">{order.customerName || '—'}</td>
                          <td className="px-3 py-2">{order.customerPhone || '—'}</td>
                          <td className="px-3 py-2">{order.productName || '—'}</td>
                          <td className="px-3 py-2 text-gray-600">{order.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={importMagicBoxOrders}
                disabled={parsedOrders.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Import {parsedOrders.length > 0 ? `${parsedOrders.length} Orders` : 'Orders'}
              </button>
              <button
                onClick={() => {
                  setShowMagicBox(false);
                  setMagicBoxData('');
                  setParsedOrders([]);
                }}
                className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Order ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Time
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {localOrders.length === 0 && !showNewRow ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No orders found. Use the 🛒 button in the Customers tab to create orders.
                </td>
              </tr>
            ) : (
              sortedOrders.map((order) => (
                <tr key={order._id} className={editingId === order._id ? "bg-blue-50" : "hover:bg-gray-50"}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {order.externalId || `#${order._id.slice(-6)}`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <select
                        value={editingData.driverId || order.driverId || ''}
                        onChange={(e) => setEditingData({ ...editingData, driverId: e.target.value || undefined })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">No Driver</option>
                        {drivers?.map(driver => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} ({driver.vehicleType})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <select
                        value={order.driverId || ''}
                        onChange={async (e) => {
                          const driverId = e.target.value || undefined;
                          if (onUpdateOrder) {
                            // Optimistically update
                            setLocalOrders(prevOrders => 
                              prevOrders.map(o => 
                                o._id === order._id 
                                  ? { ...o, driverId } 
                                  : o
                              )
                            );
                            
                            const success = await onUpdateOrder(order._id, {
                              status: order.status,
                              priority: order.priority,
                              notes: order.notes,
                              productId: order.productId,
                              driverId,
                              latitude: order.latitude,
                              longitude: order.longitude,
                            });
                            
                            if (!success) {
                              // Revert on failure
                              setLocalOrders(orders);
                            }
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500 bg-white hover:bg-gray-50"
                      >
                        <option value="">No Driver</option>
                        {drivers?.map(driver => (
                          <option key={driver._id} value={driver._id}>
                            {driver.name} ({driver.vehicleType})
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingId === order._id ? (
                      <select
                        value={editingData.productId || order.productId || ''}
                        onChange={(e) => setEditingData({ ...editingData, productId: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Product</option>
                        {products.filter(p => p.inStock).map(product => (
                          <option key={product._id} value={product._id}>
                            {product.title} - AED {product.price.toFixed(2)}
                          </option>
                        ))}
                      </select>
                    ) : order.product ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.product.title || order.product.name}</div>
                        <div className="text-xs text-gray-500">
                          AED {((order.product.raw as any)?.price || order.orderValue || 0).toFixed(2)} • {(order.product.raw as any)?.category || 'N/A'}
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No product info</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <select
                        value={editingData.status || order.status}
                        onChange={(e) => setEditingData({ ...editingData, status: e.target.value as any })}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="Pending">Pending</option>
                        <option value="On Way">On Way</option>
                        <option value="Delivered">Delivered</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    )}
                  </td>
                  {/* Delivery Time */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <select
                        value={editingData.deliveryTime || order.deliveryTime || ''}
                        onChange={(e) => setEditingData({ ...editingData, deliveryTime: e.target.value as any })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="">Select Time</option>
                        <option value="today">Today</option>
                        <option value="tomorrow">Tomorrow</option>
                        <option value="2-days">2 Days After</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        order.deliveryTime === 'today' ? 'bg-red-100 text-red-800' :
                        order.deliveryTime === 'tomorrow' ? 'bg-yellow-100 text-yellow-800' :
                        order.deliveryTime === '2-days' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.deliveryTime === 'today' ? 'Today' :
                         order.deliveryTime === 'tomorrow' ? 'Tomorrow' :
                         order.deliveryTime === '2-days' ? '2 Days After' :
                         'Not Set'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {editingId === order._id ? (
                      <textarea
                        value={editingData.notes || order.notes || ''}
                        onChange={(e) => setEditingData({ ...editingData, notes: e.target.value })}
                        className="border border-gray-300 rounded px-2 py-1 text-xs w-full"
                        rows={2}
                        placeholder="Order notes..."
                      />
                    ) : (
                      order.notes || '-'
                    )}
                  </td>
                  {/* Location */}
                  <td className="px-6 py-4">
                    {editingId === order._id ? (
                      <div>
                        <div className="flex gap-1 mb-1">
                          <input
                            type="number"
                            step="any"
                            value={editingData.latitude ?? order.latitude ?? ''}
                            onChange={(e) => setEditingData({ ...editingData, latitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Lat"
                            disabled={saving}
                          />
                          <input
                            type="number"
                            step="any"
                            value={editingData.longitude ?? order.longitude ?? ''}
                            onChange={(e) => setEditingData({ ...editingData, longitude: e.target.value ? parseFloat(e.target.value) : undefined })}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Lng"
                            disabled={saving}
                          />
                        </div>
                        <input
                          type="text"
                          onPaste={(e) => handleLocationPaste(e, true)}
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="📍 Paste Google Maps link"
                          disabled={saving}
                        />
                      </div>
                    ) : (
                      <div className="text-xs text-gray-900">
                        {order.latitude && order.longitude ? (
                          <>{order.latitude.toFixed(4)}, {order.longitude.toFixed(4)}</>
                        ) : (
                          '-'
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === order._id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={saveEdit}
                          disabled={saving}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                        >
                          {saving ? '...' : 'Save'}
                        </button>
                        <button
                          onClick={cancelEdit}
                          disabled={saving}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => startEdit(order)}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1"
                          title="Edit Order"
                        >
                          <Edit2 size={16} />
                        </button>
                        {onDeleteOrder && (
                          <button
                            onClick={() => handleDeleteOrder(order._id, order.customerName)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                            title="Delete Order"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}

            {/* New order row */}
            {showNewRow && (
              <tr className="bg-green-50 border-2 border-green-200">
                <td className="px-6 py-4 text-center text-gray-400 text-sm">
                  New
                </td>
                <td className="px-6 py-4">
                  <select
                    value={newOrder.customerId}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, customerId: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={saving}
                  >
                    <option value="">Select Customer *</option>
                    {customers.map(customer => (
                      <option key={customer._id} value={customer._id}>
                        {customer.name} - {customer.phone}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-center text-gray-400 text-sm">
                  Not assigned
                </td>
                <td className="px-6 py-4">
                  <select
                    value={newOrder.productId}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, productId: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={saving}
                  >
                    <option value="">Select Product *</option>
                    {products.filter(p => p.inStock).map(product => (
                      <option key={product._id} value={product._id}>
                        {product.title} - AED {product.price.toFixed(2)}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-center text-gray-400 text-sm">
                  Pending
                </td>
                {/* Delivery Time */}
                <td className="px-6 py-4">
                  <select
                    value={newOrder.deliveryTime || ''}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, deliveryTime: e.target.value as any }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={saving}
                  >
                    <option value="">Select Time</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="2-days">2 Days After</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <textarea
                    value={newOrder.notes}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    rows={2}
                    placeholder="Order notes (optional)"
                    disabled={saving}
                  />
                </td>
                {/* Location */}
                <td className="px-6 py-4">
                  <div>
                    <div className="flex gap-1 mb-1">
                      <input
                        type="number"
                        step="any"
                        value={newOrder.latitude ?? ''}
                        onChange={(e) => setNewOrder(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Lat"
                        disabled={saving}
                      />
                      <input
                        type="number"
                        step="any"
                        value={newOrder.longitude ?? ''}
                        onChange={(e) => setNewOrder(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Lng"
                        disabled={saving}
                      />
                    </div>
                    <input
                      type="text"
                      onPaste={(e) => handleLocationPaste(e, false)}
                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      placeholder="📍 Paste Google Maps link"
                      disabled={saving}
                    />
                  </div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={saveNewOrder}
                      disabled={saving}
                      className="text-green-600 hover:text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      title="Save New Order"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={cancelNewOrder}
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
          </tbody>
        </table>
      </div>
    </div>
  );
}