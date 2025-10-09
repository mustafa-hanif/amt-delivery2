import { useState, useEffect } from "react";
import { LayoutDashboard, Users, Package, Car, ClipboardList, Wrench, RefreshCw, Clock, CheckCircle, Truck } from "lucide-react";
import { CustomersGrid } from "./CustomersGrid";
import { ProductsGrid } from "./ProductsGrid";
import { DriversGrid } from "./DriversGrid";
import { OrdersGrid } from "./OrdersGrid";
import { DriverAssignmentModal } from "./DriverAssignmentModal";
import { adminService } from "../../services/adminService";
import { deliveryService } from "../../services/deliveryService";
import type { Customer, Product, Driver, Delivery, AdminStats } from "../../types";

type ActiveTab = 'overview' | 'customers' | 'products' | 'drivers' | 'orders';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [orders, setOrders] = useState<Delivery[]>([]);
  
  // Modal states
  const [showDriverAssignment, setShowDriverAssignment] = useState(false);
  const [assigningOrder, setAssigningOrder] = useState<Delivery | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, customersData, productsData, driversData, ordersData] = await Promise.all([
        adminService.getAdminStats(),
        adminService.getCustomers(),
        adminService.getProducts(),
        adminService.getDrivers(),
        deliveryService.getDeliveries(),
      ]);

      setStats(statsData);
      setCustomers(customersData);
      setProducts(productsData);
      setDrivers(driversData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  };

  const runMigration = async () => {
    try {
      setLoading(true);
      const result = await adminService.fixDeliveriesSchema();
      if (result?.success) {
        alert(`Migration completed! Fixed ${result.fixedCount} out of ${result.totalDeliveries} deliveries.`);
        await loadData(); // Refresh data
      } else {
        alert('Migration failed. Check console for errors.');
      }
    } catch (error) {
      console.error('Migration error:', error);
      alert('Migration failed. Check console for errors.');
    } finally {
      setLoading(false);
    }
  };

  // Driver assignment handler for orders
  const handleAssignDriver = (order: Delivery) => {
    setAssigningOrder(order);
    setShowDriverAssignment(true);
  };

  const handleDriverAssignment = async (driverId: string, priority: 'low' | 'medium' | 'high' | 'urgent', notes?: string) => {
    if (!assigningOrder) return false;

    const success = await adminService.assignDriverToOrder(
      assigningOrder._id,
      driverId,
      priority,
      notes
    );

    if (success) {
      await loadData(); // Refresh data
      setShowDriverAssignment(false);
      setAssigningOrder(null);
    }

    return success;
  };

  const handleCloseModals = () => {
    setShowDriverAssignment(false);
    setAssigningOrder(null);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', Icon: LayoutDashboard },
    { id: 'customers' as const, label: 'Customers', Icon: Users },
    { id: 'products' as const, label: 'Products', Icon: Package },
    { id: 'drivers' as const, label: 'Drivers', Icon: Car },
    { id: 'orders' as const, label: 'Orders', Icon: ClipboardList },
  ];

  const StatCard = ({ title, value, Icon, color }: { title: string; value: number; Icon: React.ComponentType<any>; color: string }) => (
    <div className={`${color} rounded-lg p-6 text-white`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-90">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="opacity-80">
          <Icon size={48} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-500">Manage your delivery operations</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={runMigration}
                disabled={loading}
                className="bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                title="Fix deliveries missing customer or product IDs"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Migrating...
                  </>
                ) : (
                  <>
                    <Wrench size={16} /> Fix Schema
                  </>
                )}
              </button>
              <button
                onClick={loadData}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Refreshing...
                  </>
                ) : (
                  <>
                    <RefreshCw size={16} /> Refresh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const TabIcon = tab.Icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <TabIcon size={18} /> {tab.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <StatCard
                title="Total Customers"
                value={stats?.totalCustomers || 0}
                Icon={Users}
                color="bg-blue-600"
              />
              <StatCard
                title="Total Products"
                value={stats?.totalProducts || 0}
                Icon={Package}
                color="bg-green-600"
              />
              <StatCard
                title="Active Drivers"
                value={stats?.activeDrivers || 0}
                Icon={Car}
                color="bg-purple-600"
              />
              <StatCard
                title="Pending Deliveries"
                value={stats?.pendingDeliveries || 0}
                Icon={Clock}
                color="bg-yellow-600"
              />
              <StatCard
                title="Completed Deliveries"
                value={stats?.completedDeliveries || 0}
                Icon={CheckCircle}
                color="bg-green-600"
              />
              <StatCard
                title="Total Drivers"
                value={stats?.totalDrivers || 0}
                Icon={Truck}
                color="bg-gray-600"
              />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Orders</h3>
                {orders.slice(0, 5).length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map(order => (
                      <div key={order._id} className="border-b pb-2 last:border-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-sm">{order.customerName}</div>
                            <div className="text-xs text-gray-500">{order.product?.title || order.product?.name}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded ${
                            order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                            order.status === 'On Way' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <DriversGrid drivers={drivers.filter(d => d.isActive).slice(0, 5)} loading={loading} />
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <CustomersGrid 
            customers={customers}
            products={products}
            loading={loading}
            onCreateCustomer={async (customerData) => {
              const success = await adminService.createCustomer(customerData);
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
            onUpdateCustomer={async (customerId, customerData) => {
              const success = await adminService.updateCustomer(customerId, customerData);
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
            onQuickOrder={async (customerId, productId) => {
              const success = await adminService.createOrder({
                customerId,
                productId,
                priority: 'medium',
              });
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
            onOrderCreated={() => {
              setActiveTab('orders'); // Navigate to orders tab
            }}
          />
        )}

        {activeTab === 'products' && (
          <ProductsGrid 
            products={products} 
            loading={loading}
            onCreateProduct={async (productData) => {
              const success = await adminService.createProduct(productData);
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
            onUpdateProduct={async (productId, productData) => {
              const success = await adminService.updateProduct(productId, productData);
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
          />
        )}

        {activeTab === 'drivers' && (
          <DriversGrid 
            drivers={drivers} 
            loading={loading}
            onCreateDriver={async (driverData) => {
              const success = await adminService.createDriver(driverData);
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
            onUpdateDriver={async (driverId, driverData) => {
              const success = await adminService.updateDriver(driverId, driverData);
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersGrid 
            orders={orders}
            customers={customers}
            products={products}
            drivers={drivers}
            loading={loading}
            onUpdateOrder={async (orderId, orderData) => {
              const success = await adminService.updateOrder(orderId, orderData);
              // OrdersGrid handles optimistic updates now
              return success;
            }}
            onCreateOrder={async (orderData) => {
              const success = await adminService.createOrder(orderData);
              if (success) {
                await loadData(); // Refresh data
              }
              return success;
            }}
          />
        )}
      </div>

      {/* Modals */}
      {showDriverAssignment && assigningOrder && (
        <DriverAssignmentModal
          customer={{
            _id: assigningOrder.customerId || '',
            name: assigningOrder.customerName,
            phone: assigningOrder.customerPhone,
            address: assigningOrder.customerAddress,
            city: assigningOrder.customerCity,
            country: assigningOrder.customerCountry,
            email: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }}
          drivers={drivers}
          productInfo={assigningOrder.product ? {
            id: assigningOrder.productId || '',
            name: String(assigningOrder.product.title || assigningOrder.product.name || 'Product'),
            price: Number((assigningOrder.product.raw as any)?.price || assigningOrder.orderValue || 0),
            category: String((assigningOrder.product.raw as any)?.category || 'N/A')
          } : undefined}
          onAssign={handleDriverAssignment}
          onCancel={handleCloseModals}
        />
      )}
    </div>
  );
}