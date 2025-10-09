import { ConvexClient } from "convex/browser";
import type { Delivery, DeliveryWithDistance, DriverLocation } from "../types";
import { CONVEX_URL } from "../config";
import { api } from "../../convex/_generated/api";

type ConvexDeliveryRecord = Partial<Delivery> & {
  _id?: string;
  _creationTime?: number;
  externalId?: string;
  id?: string;
};

export class DeliveryService {
  private static instance: DeliveryService;
  private client: ConvexClient | null;

  private constructor() {
    this.client = null;
  }

  static getInstance(): DeliveryService {
    if (!DeliveryService.instance) {
      DeliveryService.instance = new DeliveryService();
    }
    return DeliveryService.instance;
  }

  async getDeliveries(status?: Delivery['status']): Promise<Delivery[]> {
    try {
      const client = this.getClient();
      const args = status ? { status } : {};
      const records = await client.query(api.deliveries.list, args);

      if (!records || !Array.isArray(records)) {
        return [];
      }

      return records.map((record: any) => this.mapFromConvex(record));
    } catch (error) {
      console.error("Error fetching deliveries:", error);
      return [];
    }
  }

  async updateDeliveryStatus(deliveryId: string, status: Delivery['status']): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.deliveries.updateStatus, {
        _id: deliveryId,
        status,
      });
      return true;
    } catch (error) {
      console.error("Error updating delivery status:", error);
      return false;
    }
  }

  async updateDeliveryTime(deliveryId: string, deliveryTime: 'today' | 'tomorrow' | '2-days'): Promise<boolean> {
    try {
      const client = this.getClient();
      await client.mutation(api.deliveries.updateDeliveryTime, {
        _id: deliveryId,
        deliveryTime,
      });
      return true;
    } catch (error) {
      console.error("Error updating delivery time:", error);
      return false;
    }
  }

  private mapFromConvex(record: ConvexDeliveryRecord): Delivery {
    const convexId = record._id ? String(record._id) : "";
    const createdAt = record.createdAt
      ?? (record._creationTime ? new Date(record._creationTime).toISOString() : new Date().toISOString());
    const updatedAt = record.updatedAt ?? createdAt;

    const latitude = this.toNumber(record.latitude, 0);
    const longitude = this.toNumber(record.longitude, 0);
    const orderValue = record.orderValue === undefined ? undefined : this.toNumber(record.orderValue);

    return {
      _id: convexId,
      externalId: record.externalId,
      customerId: record.customerId ? String(record.customerId) : undefined,
      driverId: record.driverId ? String(record.driverId) : undefined,
      productId: record.productId ? String(record.productId) : undefined,
      customerName: record.customerName ?? "",
      customerPhone: record.customerPhone ?? "",
      customerAddress: record.customerAddress ?? "",
      latitude,
      longitude,
      status: this.normalizeStatus(record.status),
      priority: (record.priority ?? "medium") as Delivery['priority'],
      estimatedDeliveryTime: record.estimatedDeliveryTime ?? undefined,
      notes: record.notes ?? undefined,
      orderValue,
      createdAt,
      updatedAt,
      driver: record.driver as Delivery['driver'],
      product: record.product as Delivery['product'],
      customerRecord: record.customerRecord as Delivery['customerRecord'],
      customerCity: record.customerCity ?? undefined,
      customerCountry: record.customerCountry ?? undefined,
    };
  }

  private toNumber(value: unknown, fallback = 0): number {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number.parseFloat(value);
      if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
        return parsed;
      }
    }

    return fallback;
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

  // Calculate distance between two points using Haversine formula
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private normalizeStatus(value: unknown): Delivery['status'] {
    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

      if (["pending", "not_started"].includes(normalized)) {
        return "Pending";
      }

      if (["on_way", "in_progress", "inprogress", "onway", "on way"].includes(normalized)) {
        return "On Way";
      }

      if (["delivered", "completed", "complete"].includes(normalized)) {
        return "Delivered";
      }

      if (["no_answer", "noanswer"].includes(normalized)) {
        return "No Answer";
      }

      if (["cancelled", "canceled"].includes(normalized)) {
        return "Cancelled";
      }

      // Handle exact matches for the new format
      if (value === "Pending" || value === "On Way" || value === "Delivered" || value === "No Answer" || value === "Cancelled") {
        return value as Delivery['status'];
      }
    }

    return "Pending";
  }


  // Sort deliveries by distance from driver location
  sortDeliveriesByDistance(deliveries: Delivery[], driverLocation: DriverLocation): DeliveryWithDistance[] {
    console.log('📍 Driver Location:', driverLocation.latitude, driverLocation.longitude);
    
    return deliveries
      .map(delivery => {
        console.log(`📦 Order ${delivery.customerName}: Destination (${delivery.latitude}, ${delivery.longitude})`);
        
        const distance = this.calculateDistance(
          driverLocation.latitude,
          driverLocation.longitude,
          delivery.latitude,
          delivery.longitude
        );
        
        console.log(`   → Distance: ${distance.toFixed(2)} km`);

        return {
          ...delivery,
          distance,
          distanceText: this.formatDistance(distance)
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }

  private formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`;
    }
    return `${distance.toFixed(1)}km`;
  }

  // Get current driver location
  async getCurrentLocation(): Promise<DriverLocation | null> {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }
}

export const deliveryService = DeliveryService.getInstance();