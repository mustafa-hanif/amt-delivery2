import { useState } from "react";
import { Plus, Edit2, X, Check, Loader2, ShoppingCart, MapPin } from "lucide-react";
import type { Customer, Product } from "../../types";

interface CustomersGridProps {
  customers: Customer[];
  products?: Product[];
  loading?: boolean;
  onEdit?: (customer: Customer) => void;
  onAddCustomer?: () => void;
  onCreateCustomer?: (customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt' | 'totalOrders'>) => Promise<boolean>;
  onUpdateCustomer?: (customerId: string, customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt' | 'totalOrders'>) => Promise<boolean>;
  onQuickOrder?: (customerId: string, productId: string) => Promise<boolean>;
  onOrderCreated?: () => void;
}

interface NewCustomerRow {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

export function CustomersGrid({ customers, products, loading, onEdit, onAddCustomer, onCreateCustomer, onUpdateCustomer, onQuickOrder, onOrderCreated }: CustomersGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Customer>>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [creatingOrderFor, setCreatingOrderFor] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [newCustomer, setNewCustomer] = useState<NewCustomerRow>({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: '',
    latitude: undefined,
    longitude: undefined
  });
  const [saving, setSaving] = useState(false);

  // Function to extract lat/lng from Google Maps URL
  const extractLocationFromUrl = (url: string): { latitude?: number; longitude?: number } => {
    try {
      // Pattern 1: https://www.google.com/maps/place/.../@25.2048,55.2708,17z/...
      // Pattern 2: https://maps.google.com/?q=25.2048,55.2708
      // Pattern 3: https://goo.gl/maps/... (shortened, harder to parse)
      // Pattern 4: https://www.google.com/maps?q=25.2048,55.2708
      // Pattern 5: https://maps.app.goo.gl/... (new Google Maps short links)
      
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
          setNewCustomer(prev => ({
            ...prev,
            latitude: location.latitude,
            longitude: location.longitude,
          }));
        }
      }
    }
  };

  const handleQuickOrder = async (customerId: string) => {
    if (!onQuickOrder || !products || products.length === 0) return;
    
    if (!selectedProductId) {
      alert('Please select a product');
      return;
    }

    setCreatingOrderFor(customerId);
    const success = await onQuickOrder(customerId, selectedProductId);
    setCreatingOrderFor(null);
    setSelectedProductId('');
    
    if (success && onOrderCreated) {
      onOrderCreated();
    }
  };

  const startQuickOrder = (customerId: string) => {
    setCreatingOrderFor(customerId);
    setSelectedProductId('');
  };

  const cancelQuickOrder = () => {
    setCreatingOrderFor(null);
    setSelectedProductId('');
  };

  const startEdit = (customer: Customer) => {
    setEditingId(customer._id);
    setEditingData({ ...customer });
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
    if (!editingId || !onUpdateCustomer) return;
    
    setSaving(true);
    const success = await onUpdateCustomer(editingId, {
      name: editingData.name!,
      phone: editingData.phone!,
      email: editingData.email,
      address: editingData.address!,
      city: editingData.city,
      country: editingData.country,
      latitude: editingData.latitude,
      longitude: editingData.longitude,
    });

    if (success) {
      setEditingId(null);
      setEditingData({});
    }
    setSaving(false);
  };

  const startNewCustomer = () => {
    setShowNewRow(true);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      latitude: undefined,
      longitude: undefined
    });
  };

  const cancelNewCustomer = () => {
    setShowNewRow(false);
    setNewCustomer({
      name: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: '',
      latitude: undefined,
      longitude: undefined
    });
  };

  const saveNewCustomer = async () => {
    if (!onCreateCustomer) return;
    
    // Basic validation
    if (!newCustomer.name.trim() || !newCustomer.phone.trim() || !newCustomer.address.trim()) {
      alert('Name, phone, and address are required');
      return;
    }

    setSaving(true);
    const success = await onCreateCustomer({
      name: newCustomer.name.trim(),
      phone: newCustomer.phone.trim(),
      email: newCustomer.email.trim() || undefined,
      address: newCustomer.address.trim(),
      city: newCustomer.city.trim() || undefined,
      country: newCustomer.country.trim() || undefined,
      latitude: newCustomer.latitude,
      longitude: newCustomer.longitude,
    });

    if (success) {
      cancelNewCustomer();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Customers</h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
        <div className="text-center py-8 text-gray-500">Loading customers...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Customers</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{customers.length} total</span>
            {!showNewRow && onCreateCustomer && (
              <button
                onClick={startNewCustomer}
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
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Address
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                City
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Country
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Orders
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Existing customers */}
            {customers.map((customer) => {
              const isEditing = editingId === customer._id;
              return (
                <tr key={customer._id} className={`${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  {/* Name */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.name || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, name: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Name"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-left font-medium text-gray-900">{customer.name}</div>
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
                      <div className="text-sm text-left text-gray-900">{customer.phone}</div>
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="email"
                        value={editingData.email || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, email: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Email (optional)"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-left text-gray-900">{customer.email || '-'}</div>
                    )}
                  </td>

                  {/* Address */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.address || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, address: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Address"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-left text-gray-900">{customer.address}</div>
                    )}
                  </td>

                  {/* City */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.city || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, city: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="City (optional)"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-left text-gray-900">{customer.city || '-'}</div>
                    )}
                  </td>

                  {/* Country */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.country || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, country: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Country (optional)"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-left text-gray-900">{customer.country || '-'}</div>
                    )}
                  </td>

                  {/* Location */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <div>
                        <div className="flex gap-1 mb-1">
                          <input
                            type="number"
                            step="any"
                            value={editingData.latitude ?? ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            onKeyDown={handleKeyDown}
                            className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Lat"
                            disabled={saving}
                          />
                          <input
                            type="number"
                            step="any"
                            value={editingData.longitude ?? ''}
                            onChange={(e) => setEditingData(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                            onKeyDown={handleKeyDown}
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
                      <div className="text-xs text-left text-gray-900">
                        {customer.latitude && customer.longitude ? (
                          <>{customer.latitude.toFixed(4)}, {customer.longitude.toFixed(4)}</>
                        ) : (
                          '-'
                        )}
                      </div>
                    )}
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3">
                    <div className="text-sm text-left text-gray-900">{customer.totalOrders || 0}</div>
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
                    ) : creatingOrderFor === customer._id ? (
                      <div className="flex items-center justify-end gap-2">
                        <select
                          value={selectedProductId}
                          onChange={(e) => setSelectedProductId(e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-green-500"
                          autoFocus
                        >
                          <option value="">Select Product *</option>
                          {products?.filter(p => p.inStock).map(product => (
                            <option key={product._id} value={product._id}>
                              {product.title} - AED {product.price.toFixed(2)}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleQuickOrder(customer._id)}
                          disabled={!selectedProductId}
                          className="text-green-600 hover:text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                          title="Create Order"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={cancelQuickOrder}
                          className="text-red-600 hover:text-red-800 px-2 py-1 rounded transition-colors"
                          title="Cancel"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => startEdit(customer)}
                          className="text-blue-600 hover:text-blue-800 px-2 py-1 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={16} />
                        </button>
                        {onQuickOrder && products && products.length > 0 && (
                          <button
                            onClick={() => startQuickOrder(customer._id)}
                            className="text-green-600 hover:text-green-800 px-2 py-1 rounded transition-colors"
                            title="Quick Add Order"
                          >
                            <ShoppingCart size={16} />
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}

            {/* New customer row */}
            {showNewRow && (
              <tr className="bg-green-50 border-2 border-green-200">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Name *"
                    disabled={saving}
                    autoFocus
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="tel"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Phone *"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Email (optional)"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Address *"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newCustomer.city}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="City (optional)"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newCustomer.country}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Country (optional)"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <div>
                    <div className="flex gap-1 mb-1">
                      <input
                        type="number"
                        step="any"
                        value={newCustomer.latitude ?? ''}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, latitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
                        className="w-20 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                        placeholder="Lat"
                        disabled={saving}
                      />
                      <input
                        type="number"
                        step="any"
                        value={newCustomer.longitude ?? ''}
                        onChange={(e) => setNewCustomer(prev => ({ ...prev, longitude: e.target.value ? parseFloat(e.target.value) : undefined }))}
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
                <td className="px-4 py-3 text-center text-gray-400 text-sm">
                  New
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={saveNewCustomer}
                      disabled={saving}
                      className="text-green-600 hover:text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      title="Save New Customer"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={cancelNewCustomer}
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
            {customers.length === 0 && !showNewRow && (
              <tr>
                <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                  No customers found. Click "Add New Row" to create your first customer.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}