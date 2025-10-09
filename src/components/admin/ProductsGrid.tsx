import { useState } from "react";
import { Plus, Edit2, X, Check, Loader2, CheckCircle, XCircle } from "lucide-react";
import type { Product } from "../../types";

interface ProductsGridProps {
  products: Product[];
  loading?: boolean;
  onCreateProduct?: (productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => Promise<string | null>;
  onUpdateProduct?: (productId: string, productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
}

interface NewProductRow {
  title: string;
  price: number;
  description: string;
  category: string;
  inStock: boolean;
  imageUrl: string;
}

export function ProductsGrid({ products, loading, onCreateProduct, onUpdateProduct }: ProductsGridProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Partial<Product>>({});
  const [showNewRow, setShowNewRow] = useState(false);
  const [newProduct, setNewProduct] = useState<NewProductRow>({
    title: '',
    price: 0,
    description: '',
    category: '',
    inStock: true,
    imageUrl: ''
  });
  const [saving, setSaving] = useState(false);

  const startEdit = (product: Product) => {
    setEditingId(product._id);
    setEditingData({ ...product });
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
    if (!editingId || !onUpdateProduct) return;
    
    setSaving(true);
    const success = await onUpdateProduct(editingId, {
      title: editingData.title!,
      price: editingData.price!,
      description: editingData.description,
      category: editingData.category,
      inStock: editingData.inStock!,
      imageUrl: editingData.imageUrl,
    });

    if (success) {
      setEditingId(null);
      setEditingData({});
    }
    setSaving(false);
  };

  const startNewProduct = () => {
    setShowNewRow(true);
    setNewProduct({
      title: '',
      price: 0,
      description: '',
      category: '',
      inStock: true,
      imageUrl: ''
    });
  };

  const cancelNewProduct = () => {
    setShowNewRow(false);
    setNewProduct({
      title: '',
      price: 0,
      description: '',
      category: '',
      inStock: true,
      imageUrl: ''
    });
  };

  const saveNewProduct = async () => {
    if (!onCreateProduct) return;
    
    // Basic validation
    if (!newProduct.title.trim() || newProduct.price <= 0) {
      alert('Title and valid price are required');
      return;
    }

    setSaving(true);
    const id = await onCreateProduct({
      title: newProduct.title.trim(),
      price: newProduct.price,
      description: newProduct.description.trim() || undefined,
      category: newProduct.category.trim() || undefined,
      inStock: newProduct.inStock,
      imageUrl: newProduct.imageUrl.trim() || undefined,
    });

    if (id) {
      cancelNewProduct();
    }
    setSaving(false);
  };
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Products</h3>
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
        </div>
        <div className="text-center py-8 text-gray-500">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Products</h3>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">{products.length} total</span>
            {!showNewRow && onCreateProduct && (
              <button
                onClick={startNewProduct}
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
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Price
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stock
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Existing products */}
            {products.map((product) => {
              const isEditing = editingId === product._id;
              return (
                <tr key={product._id} className={`${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                  {/* Title */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.title || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, title: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Product title"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{product.title}</div>
                    )}
                  </td>

                  {/* Price */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={editingData.price || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="0.00"
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm font-medium text-gray-900">
                        AED {product.price.toFixed(2)}
                      </div>
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <textarea
                        value={editingData.description || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, description: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEdit();
                          }
                        }}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Description (optional)"
                        rows={2}
                        disabled={saving}
                      />
                    ) : (
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {product.description || '-'}
                      </div>
                    )}
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editingData.category || ''}
                        onChange={(e) => setEditingData(prev => ({ ...prev, category: e.target.value }))}
                        onKeyDown={handleKeyDown}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Category (optional)"
                        disabled={saving}
                      />
                    ) : (
                      product.category ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {product.category}
                        </span>
                      ) : (
                        <div className="text-sm text-gray-400">-</div>
                      )
                    )}
                  </td>

                  {/* Stock Status */}
                  <td className="px-4 py-3">
                    {isEditing ? (
                      <select
                        value={editingData.inStock ? 'true' : 'false'}
                        onChange={(e) => setEditingData(prev => ({ ...prev, inStock: e.target.value === 'true' }))}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={saving}
                      >
                        <option value="true">In Stock</option>
                        <option value="false">Out of Stock</option>
                      </select>
                    ) : (
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        product.inStock 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {product.inStock ? <><CheckCircle size={12} /> In Stock</> : <><XCircle size={12} /> Out of Stock</>}
                      </span>
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
                          onClick={() => startEdit(product)}
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

            {/* New product row */}
            {showNewRow && (
              <tr className="bg-green-50 border-2 border-green-200">
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newProduct.title}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Product title *"
                    disabled={saving}
                    autoFocus
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newProduct.price || ''}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Price *"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <textarea
                    value={newProduct.description}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Description (optional)"
                    rows={2}
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    placeholder="Category (optional)"
                    disabled={saving}
                  />
                </td>
                <td className="px-4 py-3">
                  <select
                    value={newProduct.inStock ? 'true' : 'false'}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, inStock: e.target.value === 'true' }))}
                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                    disabled={saving}
                  >
                    <option value="true">In Stock</option>
                    <option value="false">Out of Stock</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={saveNewProduct}
                      disabled={saving}
                      className="text-green-600 hover:text-green-800 px-2 py-1 rounded transition-colors disabled:opacity-50"
                      title="Save New Product"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                    </button>
                    <button
                      onClick={cancelNewProduct}
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
            {products.length === 0 && !showNewRow && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No products found. Click "Add New Row" to create your first product.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}