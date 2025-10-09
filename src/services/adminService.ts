import { ConvexClient } from "convex/browser";
import type { Customer, Product, Driver, AdminStats } from "../types";
import { CONVEX_URL } from "../config";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";

export class AdminService {
  private static instance: AdminService;
  private client: ConvexClient | null;

  private constructor() {
    this.client = null;
  }

  static getInstance(): AdminService {
    if (!AdminService.instance) {
      AdminService.instance = new AdminService();
    }
    return AdminService.instance;
  }

  private getClient(): ConvexClient {
    if (!CONVEX_URL) {
      throw new Error(
        "CONVEX_URL is not configured. Set CONVEX_URL or VITE_CONVEX_URL to your Convex deployment URL."
      );
    }

    if (!this.client) {
      this.client = new ConvexClient(CONVEX_URL);
    }

    return this.client;
  }

  // Customer methods
  async getCustomers(): Promise<Customer[]> {
    try {
      const client = this.getClient();
      const records = await client.query(api.admin.listCustomers, {});
      return records.map((record: any) => this.mapCustomerFromConvex(record));
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  }

  async createCustomer(customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt' | 'totalOrders'>): Promise<string | null> {
    try {
      const client = this.getClient();
      const id = await client.mutation(api.admin.createCustomer, customerData);
      return id as string;
    } catch (error) {
      console.error("Error creating customer:", error);
      return null;
    }
  }

  async updateCustomer(id: string, customerData: Omit<Customer, '_id' | 'createdAt' | 'updatedAt' | 'totalOrders'>): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.updateCustomer, { id: id as any, ...customerData });
      return true;
    } catch (error) {
      console.error("Error updating customer:", error);
      return false;
    }
  }

  async deleteCustomer(id: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.deleteCustomer, { id: id as any });
      return true;
    } catch (error) {
      console.error("Error deleting customer:", error);
      return false;
    }
  }

  async assignCustomerToDriver(customerId: string, driverId: string, productId: string, priority: 'low' | 'medium' | 'high' | 'urgent', notes?: string, estimatedDeliveryTime?: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.createDeliveryWithAssignment, {
        customerId: customerId as any,
        driverId: driverId as any,
        productId: productId as any,
        priority,
        notes,
        estimatedDeliveryTime,
      });
      return true;
    } catch (error) {
      console.error("Error assigning customer to driver:", error);
      return false;
    }
  }

  // Product methods
  async getProducts(): Promise<Product[]> {
    try {
      const client = this.getClient();
      const records = await client.query(api.admin.listProducts, {});
      return records.map((record: any) => this.mapProductFromConvex(record));
    } catch (error) {
      console.error("Error fetching products:", error);
      return [];
    }
  }

  async createProduct(productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
      const client = this.getClient();
      const id = await client.mutation(api.admin.createProduct, productData);
      return id as string;
    } catch (error) {
      console.error("Error creating product:", error);
      return null;
    }
  }

  async updateProduct(id: string, productData: Omit<Product, '_id' | 'createdAt' | 'updatedAt'>): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.updateProduct, { id: id as any, ...productData });
      return true;
    } catch (error) {
      console.error("Error updating product:", error);
      return false;
    }
  }

  // Driver methods
  async getDrivers(): Promise<Driver[]> {
    try {
      const client = this.getClient();
      const records = await client.query(api.admin.listDrivers, {});
      return records.map((record: any) => this.mapDriverFromConvex(record));
    } catch (error) {
      console.error("Error fetching drivers:", error);
      return [];
    }
  }

  async createDriver(driverData: Omit<Driver, '_id' | 'createdAt' | 'updatedAt' | 'isActive' | 'rating' | 'totalDeliveries' | 'currentLatitude' | 'currentLongitude'>): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.createDriver, driverData);
      return true;
    } catch (error) {
      console.error("Error creating driver:", error);
      return false;
    }
  }

  async updateDriver(id: string, driverData: Omit<Driver, '_id' | 'createdAt' | 'updatedAt' | 'totalDeliveries' | 'currentLatitude' | 'currentLongitude'>): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.updateDriver, { id: id as any, ...driverData });
      return true;
    } catch (error) {
      console.error("Error updating driver:", error);
      return false;
    }
  }

  async updateOrder(id: string, orderData: {
    status: 'Pending' | 'On Way' | 'Delivered';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deliveryTime?: 'today' | 'tomorrow' | '2-days';
    notes?: string;
    productId?: string;
    driverId?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.updateOrder, { 
        id: id as any, 
        status: orderData.status,
        priority: orderData.priority,
        deliveryTime: orderData.deliveryTime,
        notes: orderData.notes,
        productId: orderData.productId as any,
        driverId: orderData.driverId as any,
        latitude: orderData.latitude,
        longitude: orderData.longitude,
      });
      return true;
    } catch (error) {
      console.error("Error updating order:", error);
      return false;
    }
  }

  async createOrder(orderData: {
    customerId: string;
    productId: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    deliveryTime?: 'today' | 'tomorrow' | '2-days';
    notes?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.createOrder, {
        customerId: orderData.customerId as any,
        productId: orderData.productId as any,
        priority: orderData.priority,
        deliveryTime: orderData.deliveryTime,
        notes: orderData.notes,
        latitude: orderData.latitude,
        longitude: orderData.longitude,
      });
      return true;
    } catch (error) {
      console.error("Error creating order:", error);
      return false;
    }
  }

  async deleteOrder(orderId: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.deleteOrder, {
        id: orderId as any,
      });
      return true;
    } catch (error) {
      console.error("Error deleting order:", error);
      return false;
    }
  }

  async assignDriverToOrder(orderId: string, driverId: string, priority: 'low' | 'medium' | 'high' | 'urgent', notes?: string): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.admin.assignDriverToOrder, {
        orderId: orderId as any,
        driverId: driverId as any,
        priority,
        notes,
      });
      return true;
    } catch (error) {
      console.error("Error assigning driver to order:", error);
      return false;
    }
  }

  // Admin stats
  async getAdminStats(): Promise<AdminStats | null> {
    try {
      const client = this.getClient();
      return await client.query(api.admin.getAdminStats, {});
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return null;
    }
  }

  // Migration function
  async fixDeliveriesSchema(): Promise<{ success: boolean; fixedCount: number; totalDeliveries: number } | null> {
    try {
      const client = this.getClient();
      return await client.mutation(api.admin.fixDeliveriesSchema, {});
    } catch (error) {
      console.error("Error fixing deliveries:", error);
      return null;
    }
  }

  // Mapping functions
  private mapCustomerFromConvex(record: any): Customer {
    return {
      _id: record._id,
      name: record.name,
      phone: record.phone,
      address: record.address,
      city: record.city,
      country: record.country,
      latitude: record.latitude,
      longitude: record.longitude,
      email: record.email,
      totalOrders: record.totalOrders ?? 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapProductFromConvex(record: any): Product {
    return {
      _id: record._id,
      title: record.title,
      price: record.price,
      description: record.description,
      category: record.category,
      inStock: record.inStock,
      imageUrl: record.imageUrl,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private mapDriverFromConvex(record: any): Driver {
    return {
      _id: record._id,
      name: record.name,
      phone: record.phone,
      vehicleType: record.vehicleType,
      licenseNumber: record.licenseNumber,
      password: record.password,
      areaCoverage: record.areaCoverage,
      isActive: record.isActive,
      currentLatitude: record.currentLatitude,
      currentLongitude: record.currentLongitude,
      rating: record.rating,
      totalDeliveries: record.totalDeliveries ?? 0,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}

export const adminService = AdminService.getInstance();