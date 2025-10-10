export interface LinkedRecordSummary {
  id: string;
  title?: string;
  name?: string;
  raw?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface Delivery {
  _id: string; // Convex uses _id instead of id
  externalId?: string;
  customerId?: string; // Reference to customer
  driverId?: string; // Reference to driver
  productId?: string; // Reference to product
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  latitude: number;
  longitude: number;
  status: 'Pending' | 'On Way' | 'Delivered' | 'No Answer' | 'Cancelled'; // Updated status values
  priority: 'low' | 'medium' | 'high' | 'urgent';
  deliveryTime?: string; // Can be 'today', 'tomorrow', '2-days', or any custom value
  estimatedDeliveryTime?: string;
  notes?: string;
  orderValue?: number;
  createdAt: string;
  updatedAt: string;
  driver?: LinkedRecordSummary;
  product?: LinkedRecordSummary;
  customerRecord?: LinkedRecordSummary;
  customerCity?: string;
  customerCountry?: string;
}

export interface DriverLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: number;
}

export interface DeliveryWithDistance extends Delivery {
  distance: number; // in kilometers
  distanceText: string; // human readable distance
}

export interface Customer {
  _id: string;
  name: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  email?: string;
  totalOrders?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  title: string;
  price: number;
  description?: string;
  category?: string;
  inStock: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Driver {
  _id: string;
  name: string;
  phone: string;
  vehicleType: 'car' | 'bike' | 'scooter' | 'van';
  licenseNumber?: string;
  password?: string; // Driver's login password
  isActive: boolean;
  areaCoverage?: string; // City or region this driver covers
  currentLatitude?: number;
  currentLongitude?: number;
  rating?: number;
  totalDeliveries?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AdminStats {
  totalCustomers: number;
  totalProducts: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingDeliveries: number;
  completedDeliveries: number;
}