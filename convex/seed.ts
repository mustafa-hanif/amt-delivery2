import { mutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";

export const seedAllData = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    // Clear existing data
    const [existingCustomers, existingProducts, existingDrivers, existingDeliveries] = await Promise.all([
      ctx.db.query("customers").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("drivers").collect(),
      ctx.db.query("deliveries").collect(),
    ]);

    for (const customer of existingCustomers) await ctx.db.delete(customer._id);
    for (const product of existingProducts) await ctx.db.delete(product._id);
    for (const driver of existingDrivers) await ctx.db.delete(driver._id);
    for (const delivery of existingDeliveries) await ctx.db.delete(delivery._id);

    const now = new Date().toISOString();

    // Seed customers
    const customerIds = [];
    const sampleCustomers = [
      {
        name: "John Smith",
        phone: "+1234567890",
        address: "123 Main St, Downtown",
        city: "New York",
        country: "USA",
        latitude: 40.7128,
        longitude: -74.0060,
        email: "john@example.com",
        totalOrders: 5,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Sarah Johnson",
        phone: "+1234567891",
        address: "456 Oak Ave, Uptown",
        city: "Los Angeles",
        country: "USA",
        latitude: 34.0522,
        longitude: -118.2437,
        email: "sarah@example.com",
        totalOrders: 3,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Mike Chen",
        phone: "+1234567892",
        address: "789 Pine Rd, Suburbs",
        city: "San Francisco",
        country: "USA",
        latitude: 37.7749,
        longitude: -122.4194,
        email: "mike@example.com",
        totalOrders: 2,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const customer of sampleCustomers) {
      const id = await ctx.db.insert("customers", customer);
      customerIds.push(id);
    }

    // Seed products
    const productIds = [];
    const sampleProducts = [
      {
        title: "Premium Headphones",
        price: 129.99,
        description: "High-quality wireless headphones with noise cancellation",
        category: "Electronics",
        inStock: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Coffee Beans - Premium Blend",
        price: 24.50,
        description: "Organic coffee beans from South America",
        category: "Food & Beverage",
        inStock: true,
        createdAt: now,
        updatedAt: now,
      },
      {
        title: "Fitness Tracker",
        price: 89.99,
        description: "Smart fitness tracker with heart rate monitor",
        category: "Electronics",
        inStock: false,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const product of sampleProducts) {
      const id = await ctx.db.insert("products", product);
      productIds.push(id);
    }

    // Seed drivers
    const driverIds = [];
    const sampleDrivers = [
      {
        name: "Alex Rodriguez",
        phone: "+1555123456",
        vehicleType: "car" as const,
        licenseNumber: "DL123456",
        isActive: true,
        currentLatitude: 40.7589,
        currentLongitude: -73.9851,
        rating: 4.8,
        totalDeliveries: 157,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "Maria Garcia",
        phone: "+1555123457",
        vehicleType: "bike" as const,
        licenseNumber: "DL789012",
        isActive: true,
        currentLatitude: 34.0522,
        currentLongitude: -118.2437,
        rating: 4.9,
        totalDeliveries: 203,
        createdAt: now,
        updatedAt: now,
      },
      {
        name: "David Kim",
        phone: "+1555123458",
        vehicleType: "van" as const,
        licenseNumber: "DL345678",
        isActive: false,
        rating: 4.6,
        totalDeliveries: 89,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const driver of sampleDrivers) {
      const id = await ctx.db.insert("drivers", driver);
      driverIds.push(id);
    }

    // Seed deliveries with proper relationships
    const sampleDeliveries = [
      {
        externalId: "DEL-001",
        customerId: customerIds[0]!,
        driverId: driverIds[0]!,
        productId: productIds[0]!,
        customerName: "John Smith",
        customerPhone: "+1234567890",
        customerAddress: "123 Main St, Downtown",
        customerCity: "New York",
        customerCountry: "USA",
        latitude: 40.7128,
        longitude: -74.0060,
        status: "Pending" as const,
        priority: "high" as const,
        estimatedDeliveryTime: "14:30",
        notes: "Please ring doorbell twice",
        orderValue: 125.50,
        createdAt: now,
        updatedAt: now,
      },
      {
        externalId: "DEL-002",
        customerId: customerIds[1]!,
        driverId: driverIds[1]!,
        productId: productIds[1]!,
        customerName: "Sarah Johnson",
        customerPhone: "+1234567891",
        customerAddress: "456 Oak Ave, Uptown",
        customerCity: "Los Angeles",
        customerCountry: "USA",
        latitude: 34.0522,
        longitude: -118.2437,
        status: "On Way" as const,
        priority: "medium" as const,
        estimatedDeliveryTime: "15:45",
        notes: "Leave at front door if not home",
        orderValue: 89.25,
        createdAt: now,
        updatedAt: now,
      },
      {
        externalId: "DEL-003",
        customerId: customerIds[2]!,
        productId: productIds[2]!,
        customerName: "Mike Chen",
        customerPhone: "+1234567892",
        customerAddress: "789 Pine Rd, Suburbs",
        customerCity: "San Francisco",
        customerCountry: "USA",
        latitude: 37.7749,
        longitude: -122.4194,
        status: "Delivered" as const,
        priority: "low" as const,
        estimatedDeliveryTime: "16:15",
        orderValue: 67.80,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const delivery of sampleDeliveries) {
      await ctx.db.insert("deliveries", delivery);
    }

    return { 
      success: true, 
      message: `Seeded ${sampleCustomers.length} customers, ${sampleProducts.length} products, ${sampleDrivers.length} drivers, and ${sampleDeliveries.length} deliveries` 
    };
  },
});