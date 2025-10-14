import { useState, useEffect } from "react";
import { Edit2, Truck, Plus, X, Check, Loader2, Trash2, Download } from "lucide-react";
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
    status: 'Pending' | 'On Way' | 'Delivered' | 'No Answer' | 'Cancelled'; 
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deliveryTime?: string;
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
    deliveryTime?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  }) => Promise<boolean>;
  onDeleteOrder?: (orderId: string) => Promise<boolean>;
  onAssignDriver?: (order: Delivery) => void;
  onCreateCustomer?: (customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt' | 'totalOrders'>) => Promise<string | null>;
  onCreateProduct?: (productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
}

export function OrdersGrid({ orders, customers, products, drivers, loading, onUpdateOrder, onCreateOrder, onDeleteOrder, onAssignDriver, onCreateCustomer, onCreateProduct }: OrdersGridProps) {
  const [localOrders, setLocalOrders] = useState<Delivery[]>(orders);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Delivery>>({});
  const [saving, setSaving] = useState(false);
  const [showMagicBox, setShowMagicBox] = useState(false);
  const [magicBoxData, setMagicBoxData] = useState('');
  const [parsedOrders, setParsedOrders] = useState<Array<{
    customerName: string;
    customerPhone: string;
    productName: string;
    address?: string;
    city?: string;
    price?: string;
    agent?: string;
    deliveryOption?: string;
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
    const lines = data.trim().split('\n');
    const parsed: Array<{
      customerName: string;
      customerPhone: string;
      productName: string;
      address?: string;
      city?: string;
      price?: string;
      agent?: string;
      deliveryOption?: string;
      notes?: string;
    }> = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      // Split by tabs - expect 8 columns
      const columns = line.split('\t');
      
      if (columns.length >= 5) {
        const name = columns[0]?.trim() || '';
        const address = columns[1]?.trim() || '';
        const city = columns[2]?.trim() || '';
        const mobile = columns[3]?.trim() || '';
        const product = columns[4]?.trim() || '';
        const price = columns[5]?.trim() || '';
        const agent = columns[6]?.trim() || '';
        const delivery = columns[7]?.trim() || '';

        parsed.push({
          customerName: name,
          customerPhone: mobile,
          productName: product,
          address: address,
          city: city,
          price: price,
          agent: agent,
          deliveryOption: delivery,
          notes: `${address}${city ? ', ' + city : ''} | Price: ${price} | Agent: ${agent} | Delivery: ${delivery}`
        });
      }
    }

    setParsedOrders(parsed);
  };

  const handleMagicBoxPaste = (e: React.ClipboardEvent) => {
    e.preventDefault(); // Prevent default paste to avoid duplication
    const pastedData = e.clipboardData.getData('text');
    setMagicBoxData(pastedData);
    parseMagicBoxData(pastedData);
  };

  const importMagicBoxOrders = async () => {
    if (!onCreateOrder || parsedOrders.length === 0) return;

    setSaving(true);
    let successCount = 0;
    let createdCustomers = 0;
    let createdProducts = 0;
    
    for (const order of parsedOrders) {
      // Find matching customer by phone number ONLY
      let customer = customers.find(c => c.phone === order.customerPhone);
      
      // Create customer if not found
      if (!customer && onCreateCustomer) {
        const customerId = await onCreateCustomer({
          name: order.customerName,
          phone: order.customerPhone,
          email: `${order.customerPhone}@temp.com`, // Temporary email
          address: order.address || '',
        });
        
        if (customerId) {
          createdCustomers++;
          // Create a temporary customer object for this import
          customer = {
            _id: customerId,
            name: order.customerName,
            phone: order.customerPhone,
            email: `${order.customerPhone}@temp.com`,
            address: order.address || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalOrders: 0,
          };
        }
      }
      
      // Find matching product by name (case-insensitive partial match)
      let product = products.find(p => 
        p.title.toLowerCase().includes(order.productName.toLowerCase()) ||
        order.productName.toLowerCase().includes(p.title.toLowerCase())
      );

      // Create product if not found
      if (!product && onCreateProduct) {
        const price = order.price ? parseFloat(order.price.replace(/[^0-9.]/g, '')) : 0;
        const productId = await onCreateProduct({
          title: order.productName,
          price: isNaN(price) ? 0 : price,
          category: 'General',
          inStock: true,
          imageUrl: '',
        });
        
        if (productId) {
          createdProducts++;
          // Create a temporary product object for this import
          product = {
            _id: productId,
            title: order.productName,
            price: isNaN(price) ? 0 : price,
            category: 'General',
            inStock: true,
            imageUrl: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        }
      }

      if (customer && product) {
        // Map delivery option to delivery time
        let deliveryTime: string | undefined;
        if (order.deliveryOption) {
          const deliveryLower = order.deliveryOption.toLowerCase();
          if (deliveryLower.includes('today') || deliveryLower.includes('express') || deliveryLower.includes('same day')) {
            deliveryTime = 'today';
          } else if (deliveryLower.includes('tomorrow') || deliveryLower.includes('next day')) {
            deliveryTime = 'tomorrow';
          } else if (deliveryLower.includes('2') || deliveryLower.includes('two') || deliveryLower.includes('2-day')) {
            deliveryTime = '2-days';
          } else {
            // Use the custom delivery option value directly
            deliveryTime = order.deliveryOption;
          }
        }
        
        console.log(`📦 Creating order for ${order.customerName} with deliveryTime:`, deliveryTime);
        
        const success = await onCreateOrder({
          customerId: customer._id,
          productId: product._id,
          priority: 'medium',
          deliveryTime: deliveryTime,
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
    
    const message = [
      `Successfully imported ${successCount} out of ${parsedOrders.length} orders!`,
      createdCustomers > 0 ? `Created ${createdCustomers} new customers` : null,
      createdProducts > 0 ? `Created ${createdProducts} new products` : null,
    ].filter(Boolean).join('\n');
    
    alert(message);
  };

  const downloadOrdersCSV = () => {
    // Define CSV headers
    const headers = [
      'Order ID',
      'Customer Name',
      'Address',
      'City',
      'Mobile',
      'Product',
      'Price (AED)',
      'Agent Name',
      'Driver',
      'Delivery Option',
      'Status',
      'Priority',
      'Notes',
      'Latitude',
      'Longitude',
      'Created At'
    ];

    // Map orders to CSV rows
    const rows = sortedOrders.map(order => {
      // Extract agent from notes
      const agentMatch = order.notes?.match(/Agent:\s*([^|]+)/);
      const agentName = agentMatch?.[1]?.trim() || '';
      
      return [
        order._id,
        order.customerName,
        order.customerAddress || '',
        order.customerCity || '',
        order.customerPhone,
        order.product ? (order.product.title || order.product.name) : '',
        (order.orderValue || (order.product?.raw as any)?.price || 0).toFixed(2),
        agentName,
        order.driverId ? (drivers?.find(d => d._id === order.driverId)?.name || 'Assigned') : '',
        order.deliveryTime === 'today' ? 'Today' :
          order.deliveryTime === 'tomorrow' ? 'Tomorrow' :
          order.deliveryTime === '2-days' ? '2 Days After' :
          order.deliveryTime || '',
        order.status,
        order.priority,
        order.notes || '',
        order.latitude || '',
        order.longitude || '',
        new Date(order.createdAt).toLocaleString()
      ];
    });

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
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLocationPaste = (e: React.ClipboardEvent, isEditing: boolean) => {
    const pastedText = e.clipboardData.getData('text');
    
    // Check if it looks like a Google Maps URL
    if (pastedText.includes('google.com/maps') || pastedText.includes('goo.gl/maps') || pastedText.includes('maps.app.goo.gl')) {
      e.preventDefault();
      const location = extractLocationFromUrl(pastedText);
      
      if (location.latitude && location.longitude) {
        setEditingData(prev => ({
          ...prev,
          latitude: location.latitude,
          longitude: location.longitude,
        }));
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
              onClick={downloadOrdersCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              title="Download orders as CSV"
            >
              <Download size={18} /> Download CSV
            </button>
            <button
              onClick={() => setShowMagicBox(!showMagicBox)}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Magic Box
            </button>
          </div>
        </div>
        
        {/* Magic Box Section */}
        {showMagicBox && (
          <div className="mt-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="mb-3">
              <h4 className="font-semibold text-purple-800 mb-1">Bulk Import Orders from Excel</h4>
              <p className="text-sm text-purple-600 mb-1">
                Paste Excel data with <strong>8 columns</strong> (tab-separated):
              </p>
              <p className="text-xs text-purple-700 font-mono bg-purple-100 px-2 py-1 rounded">
                Name | Address | City | Mobile | Product | Price | Agent | Delivery Option
              </p>
              <p className="text-xs text-purple-500 mt-1">
                Example: YOUNUS | Barwa road Barwa camp | DOHA | 97430837436 | YAMANI KHALTA | 100 | Ahmad | Express
              </p>
            </div>
            
            <textarea
              value={magicBoxData}
              onChange={(e) => setMagicBoxData(e.target.value)}
              onPaste={handleMagicBoxPaste}
              placeholder="Paste your Excel data here (tab-separated)...&#10;Format: Name | Address | City | Mobile | Product | Price | Agent | Delivery"
              className="w-full h-32 p-3 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            
            {parsedOrders.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium text-purple-700 mb-2">
                  Preview: {parsedOrders.length} orders detected
                </p>
                <div className="max-h-48 overflow-y-auto overflow-x-auto bg-white border border-purple-200 rounded">
                  <table className="min-w-full text-sm">
                    <thead className="bg-purple-100 sticky top-0">
                      <tr>
                        <th className="px-3 py-2 text-left text-purple-800">Customer</th>
                        <th className="px-3 py-2 text-left text-purple-800">Phone</th>
                        <th className="px-3 py-2 text-left text-purple-800">Address</th>
                        <th className="px-3 py-2 text-left text-purple-800">City</th>
                        <th className="px-3 py-2 text-left text-purple-800">Product</th>
                        <th className="px-3 py-2 text-left text-purple-800">Price</th>
                        <th className="px-3 py-2 text-left text-purple-800">Agent</th>
                        <th className="px-3 py-2 text-left text-purple-800">Delivery</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedOrders.map((order, idx) => (
                        <tr key={idx} className="border-t border-purple-100">
                          <td className="px-3 py-2">{order.customerName || '—'}</td>
                          <td className="px-3 py-2">{order.customerPhone || '—'}</td>
                          <td className="px-3 py-2">{order.address || '—'}</td>
                          <td className="px-3 py-2">{order.city || '—'}</td>
                          <td className="px-3 py-2">{order.productName || '—'}</td>
                          <td className="px-3 py-2">{order.price || '—'}</td>
                          <td className="px-3 py-2">{order.agent || '—'}</td>
                          <td className="px-3 py-2">{order.deliveryOption || '—'}</td>
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
                Customer Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mobile
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Product
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Agent Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Driver
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delivery Option
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {localOrders.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-6 py-4 text-center text-gray-500">
                  No orders found. Use the 🛒 button in the Customers tab to create orders.
                </td>
              </tr>
            ) : (
              sortedOrders.map((order) => {
                const hasInvalidLocation = !order.latitude || !order.longitude || (order.latitude === 0 && order.longitude === 0);
                return (
                <tr key={order._id} className={`${editingId === order._id ? "bg-blue-50" : "hover:bg-gray-50"} ${hasInvalidLocation ? "border-l-4 border-l-orange-500" : ""}`}>
                  {/* Customer Name */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.customerName}</div>
                  </td>
                  {/* Address */}
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{order.customerAddress || '-'}</div>
                  </td>
                  {/* City */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{order.customerCity || '-'}</div>
                  </td>
                  {/* Mobile */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{order.customerPhone}</div>
                  </td>
                  {/* Product */}
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
                      <div className="text-sm font-medium text-gray-900">{order.product.title || order.product.name}</div>
                    ) : (
                      <span className="text-sm text-gray-400">No product info</span>
                    )}
                  </td>
                  {/* Price */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      AED {(order.orderValue || (order.product?.raw as any)?.price || 0).toFixed(2)}
                    </div>
                  </td>
                  {/* Agent Name - Extract from notes if available */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {(() => {
                        // Try to extract agent from notes (format: "... | Agent: Name | ...")
                        const match = order.notes?.match(/Agent:\s*([^|]+)/);
                        return match?.[1]?.trim() || '-';
                      })()}
                    </div>
                  </td>
                  {/* Driver (Dropdown) */}
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
                            {driver.name}
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
                            {driver.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                  {/* Delivery Option */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <div className="flex flex-col gap-1">
                        <select
                          value={editingData.deliveryTime || order.deliveryTime || ''}
                          onChange={(e) => setEditingData({ ...editingData, deliveryTime: e.target.value })}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="">Not Set</option>
                          <option value="today">Today</option>
                          <option value="tomorrow">Tomorrow</option>
                          <option value="2-days">2 Days After</option>
                          {order.deliveryTime && !['', 'today', 'tomorrow', '2-days'].includes(order.deliveryTime) && (
                            <option value={order.deliveryTime}>{order.deliveryTime}</option>
                          )}
                        </select>
                        <input
                          type="text"
                          value={editingData.deliveryTime || order.deliveryTime || ''}
                          onChange={(e) => setEditingData({ ...editingData, deliveryTime: e.target.value })}
                          placeholder="Or type custom..."
                          className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        order.deliveryTime === 'today' ? 'bg-red-100 text-red-800' :
                        order.deliveryTime === 'tomorrow' ? 'bg-yellow-100 text-yellow-800' :
                        order.deliveryTime === '2-days' ? 'bg-green-100 text-green-800' :
                        order.deliveryTime ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {order.deliveryTime === 'today' ? 'Today' :
                         order.deliveryTime === 'tomorrow' ? 'Tomorrow' :
                         order.deliveryTime === '2-days' ? '2 Days After' :
                         order.deliveryTime || 'Not Set'}
                      </span>
                    )}
                  </td>
                  {/* Location */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <input
                        type="text"
                        placeholder="Paste Google Maps URL"
                        onPaste={(e) => handleLocationPaste(e, true)}
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    ) : (
                      <div className="text-xs text-gray-500">
                        {order.latitude && order.longitude && order.latitude !== 0 && order.longitude !== 0 ? (
                          <a
                            href={`https://www.google.com/maps?q=${order.latitude},${order.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                          >
                            📍 Map
                          </a>
                        ) : (
                          <span className="text-orange-600">⚠️ No location</span>
                        )}
                      </div>
                    )}
                  </td>
                  {/* Status */}
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
                        <option value="No Answer">No Answer</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    )}
                  </td>
                  {/* Actions */}
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
              );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}