import { useState, useEffect } from "react";
import { DeliveryCard } from "./DeliveryCard";
import { deliveryService } from "../services/deliveryService";
import type { DeliveryWithDistance, Delivery, DriverLocation } from "../types";
import { MapPin, RefreshCw } from "lucide-react";

interface DeliveryListProps {
  driverId?: string;
}

export function DeliveryList({ driverId }: DeliveryListProps) {
  const [deliveries, setDeliveries] = useState<DeliveryWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [driverLocation, setDriverLocation] = useState<DriverLocation | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean | null>(null);
  const [filter, setFilter] = useState<'all' | Delivery['status']>('all');

  useEffect(() => {
    requestLocationPermission();
  }, []);

  // Reload deliveries whenever driver location changes
  useEffect(() => {
    if (driverLocation !== null || locationPermission === false) {
      loadDeliveries();
    }
  }, [driverLocation, filter, driverId]);

  const requestLocationPermission = async () => {
    try {
      const location = await deliveryService.getCurrentLocation();
      if (location) {
        setDriverLocation(location);
        setLocationPermission(true);
      } else {
        setLocationPermission(false);
      }
    } catch (err) {
      setLocationPermission(false);
      console.error("Error getting location:", err);
    }
  };

  const loadDeliveries = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Loading deliveries... driverLocation:', driverLocation);
      console.log('👤 Driver ID:', driverId);

  // Get deliveries from Convex
  const statusFilter = filter === 'all' ? undefined : filter;
      let deliveriesData = await deliveryService.getDeliveries(statusFilter);
      console.log('📥 Received deliveries from backend:', deliveriesData.length, 'orders');

      // Filter deliveries by driver if driverId is provided (driver view)
      if (driverId) {
        console.log('🔍 Filtering deliveries for driver:', driverId);
        deliveriesData = deliveriesData.filter(delivery => delivery.driverId === driverId);
        console.log('✅ Filtered to', deliveriesData.length, 'orders for this driver');
      }

      if (driverLocation) {
        console.log('✅ Driver location available, calculating distances...');
        // Sort by distance if we have driver location
        console.log('🚗 Sorting deliveries by distance from driver location...');
        const sortedDeliveries = deliveryService.sortDeliveriesByDistance(deliveriesData, driverLocation);
        console.log('✅ After sorting, first delivery:', sortedDeliveries[0]?.customerName, 'distanceText:', sortedDeliveries[0]?.distanceText);
        
        // The sortDeliveriesByDistance already handles distance calculation
        // Just validate and mark invalid coordinates
        const deliveriesWithValidation = sortedDeliveries.map(delivery => {
          // Debug log
          console.log('🔍 Validating:', delivery.customerName, 'Coords:', delivery.latitude, delivery.longitude, 'Current distanceText:', delivery.distanceText);
          
          // Only override if coordinates are truly invalid (0,0 or missing)
          if (!delivery.latitude || !delivery.longitude || (delivery.latitude === 0 && delivery.longitude === 0)) {
            console.log('  ❌ Invalid coords, setting to Location unknown');
            return {
              ...delivery,
              distance: 0,
              distanceText: 'Location unknown'
            };
          }
          // Return as-is with calculated distance from sortDeliveriesByDistance
          console.log('  ✅ Valid coords, keeping distanceText:', delivery.distanceText);
          return delivery;
        });
        
        console.log('📋 Final deliveries:', deliveriesWithValidation.map(d => `${d.customerName}: ${d.distanceText}`));
        setDeliveries(deliveriesWithValidation);
      } else {
        console.log('❌ No driver location available, marking all as location unknown');
        // Convert to DeliveryWithDistance format without distance sorting
        const deliveriesWithDistance = deliveriesData.map(delivery => ({
          ...delivery,
          distance: 0,
          distanceText: 'Location unknown'
        }));
        setDeliveries(deliveriesWithDistance);
      }
    } catch (err) {
      setError("Failed to load deliveries. Please try again.");
      console.error("Error loading deliveries:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (deliveryId: string, status: Delivery['status']) => {
    const success = await deliveryService.updateDeliveryStatus(deliveryId, status);
    if (success) {
      // Update local state
      setDeliveries(prev =>
        prev.map(delivery =>
          delivery._id === deliveryId
            ? { ...delivery, status }
            : delivery
        )
      );
    } else {
      alert("Failed to update delivery status. Please try again.");
    }
  };

  const handleDeliveryTimeUpdate = (deliveryId: string, deliveryTime: string) => {
    // Update local state
    setDeliveries(prev =>
      prev.map(delivery =>
        delivery._id === deliveryId
          ? { ...delivery, deliveryTime }
          : delivery
      )
    );
  };

  const refreshLocation = async () => {
    const location = await deliveryService.getCurrentLocation();
    if (location) {
      setDriverLocation(location);
      // Reload deliveries with new location
      await loadDeliveries();
    } else {
      alert("Unable to get your location. Please check your browser permissions.");
    }
  };

  const filteredDeliveries = deliveries.filter(delivery => {
    if (filter === 'all') return true;
    return delivery.status === filter;
  });

  const statusLabels: Record<'all' | Delivery['status'], string> = {
    all: 'All',
    Pending: 'Pending',
    'On Way': 'On Way',
    Delivered: 'Delivered',
    'No Answer': 'No Answer',
    Cancelled: 'Cancelled',
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading deliveries...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadDeliveries}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="delivery-list px-2 lg:px-8 py-4">
      <div className="mb-6">
        <h1 className="text-2xl hidden md:block font-bold text-gray-800 mb-4">My Deliveries</h1>

        {/* Location Status */}
        <div className="bg-gray-50 p-3 rounded-lg mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 flex items-center gap-1">
                <MapPin size={12} />
                <div>
                  Location: {locationPermission === null ? 'Checking...' :
                    locationPermission ? 'Enabled' : 'Disabled'}
                  {/* {driverLocation && (
                    <span className="ml-2 text-xs font-mono bg-blue-50 px-2 py-1 rounded">
                      ({driverLocation.latitude.toFixed(6)}, {driverLocation.longitude.toFixed(6)})
                    </span>
                  )} */}
                </div>
              </span>
              {/* {driverLocation && (
                <span className="text-xs text-gray-500">
                  (Updated {new Date(driverLocation.timestamp).toLocaleTimeString()})
                </span>
              )} */}
            </div>
            <button
              onClick={refreshLocation}
              className="text-blue-500 hover:text-blue-600 text-sm underline flex items-center gap-1"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          {([
            { key: 'all' as const, label: statusLabels.all, count: deliveries.length },
            { key: 'Pending' as const, label: statusLabels.Pending, count: deliveries.filter(d => d.status === 'Pending').length },
            { key: 'On Way' as const, label: statusLabels['On Way'], count: deliveries.filter(d => d.status === 'On Way').length },
            { key: 'Delivered' as const, label: statusLabels.Delivered, count: deliveries.filter(d => d.status === 'Delivered').length },
            { key: 'No Answer' as const, label: statusLabels['No Answer'], count: deliveries.filter(d => d.status === 'No Answer').length },
            { key: 'Cancelled' as const, label: statusLabels.Cancelled, count: deliveries.filter(d => d.status === 'Cancelled').length }
          ]).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                filter === key
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {label} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No deliveries found</p>
          <p className="text-gray-400 text-sm mt-2">
            {filter === 'all' ? 'You have no deliveries at the moment.' : `No ${statusLabels[filter]} deliveries.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDeliveries.map((delivery) => (
            <DeliveryCard
              key={delivery._id}
              delivery={delivery}
              onStatusUpdate={handleStatusUpdate}
              onDeliveryTimeUpdate={handleDeliveryTimeUpdate}
            />
          ))}
        </div>
      )}

      {/* Refresh Button */}
      <div className="text-center mt-6">
        <button
          onClick={loadDeliveries}
          className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
        >
          <RefreshCw size={18} /> Refresh Deliveries
        </button>
      </div>
    </div>
  );
}