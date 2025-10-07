import { useState } from "react";
import { Edit2, Truck, Plus, X, Check, Loader2 } from "lucide-react";
import type { Delivery, Customer, Product } from "../../types";

interface OrdersGridProps {
  orders: Delivery[];
  customers: Customer[];
  products: Product[];
  loading?: boolean;
  onUpdateOrder?: (orderId: string, orderData: { 
    status: 'Pending' | 'On Way' | 'Delivered'; 
    priority: 'low' | 'medium' | 'high' | 'urgent'; 
    notes?: string;
    productId?: string;
  }) => Promise<boolean>;
  onCreateOrder?: (orderData: {
    customerId: string;
    productId: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    notes?: string;
  }) => Promise<boolean>;
  onAssignDriver?: (order: Delivery) => void;
}

export function OrdersGrid({ orders, customers, products, loading, onUpdateOrder, onCreateOrder, onAssignDriver }: OrdersGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Delivery>>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customerId: '',
    productId: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const startEdit = (order: Delivery) => {
    setEditingId(order._id);
    setEditingData({ ...order });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingData({});
  };

  const saveEdit = async () => {
    if (!editingId || !onUpdateOrder) return;
    
    setSaving(true);
    const success = await onUpdateOrder(editingId, {
      status: editingData.status!,
      priority: editingData.priority!,
      notes: editingData.notes,
      productId: editingData.productId,
    });

    if (success) {
      setEditingId(null);
      setEditingData({});
    }
    setSaving(false);
  };

  const startNewOrder = () => {
    setShowNewRow(true);
    setNewOrder({
      customerId: '',
      productId: '',
      priority: 'medium',
      notes: '',
    });
  };

  const cancelNewOrder = () => {
    setShowNewRow(false);
    setNewOrder({
      customerId: '',
      productId: '',
      priority: 'medium',
      notes: '',
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
      notes: newOrder.notes || undefined,
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
  const sortedOrders = [...orders].sort((a, b) => {
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
          </div>
        </div>
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
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Notes
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.length === 0 && !showNewRow ? (
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
                    {order.driver ? (
                      <div>
                        <div className="text-sm font-medium text-gray-900">{String(order.driver.name || '')}</div>
                        <div className="text-sm text-gray-500">{String(order.driver.phone || '')}</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Not assigned</span>
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
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === order._id ? (
                      <select
                        value={editingData.priority || order.priority}
                        onChange={(e) => setEditingData({ ...editingData, priority: e.target.value as any })}
                        className="border border-gray-300 rounded px-2 py-1 text-xs"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(order.priority)}`}>
                        {order.priority.toUpperCase()}
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
                        {onAssignDriver && (
                          <button
                            onClick={() => onAssignDriver(order)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1"
                            title="Assign Driver"
                          >
                            <Truck size={16} />
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
                <td className="px-6 py-4">
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, priority: e.target.value as any }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={saving}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
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