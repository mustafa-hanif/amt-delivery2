import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

// Customer queries and mutations
export const listCustomers = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query("customers").collect();
  },
});

export const getCustomer = query({
  args: { id: v.id("customers") },
  handler: async (ctx: QueryCtx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const createCustomer = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    email: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("customers", {
      ...args,
      totalOrders: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateCustomer = mutation({
  args: {
    id: v.id("customers"),
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    email: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { id, ...updateData } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: now,
    });
    
    return true;
  },
});

export const deleteCustomer = mutation({
  args: { id: v.id("customers") },
  handler: async (ctx: MutationCtx, args) => {
    await ctx.db.delete(args.id);
    return true;
  },
});

// Create delivery with customer assignment to driver
export const createDeliveryWithAssignment = mutation({
  args: {
    customerId: v.id("customers"),
    driverId: v.id("drivers"),
    productId: v.id("products"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    notes: v.optional(v.string()),
    estimatedDeliveryTime: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const [customer, driver, product] = await Promise.all([
      ctx.db.get(args.customerId),
      ctx.db.get(args.driverId),
      ctx.db.get(args.productId),
    ]);

    if (!customer || !driver || !product) {
      throw new Error("Customer, driver, or product not found");
    }

    const now = new Date().toISOString();
    
    return await ctx.db.insert("deliveries", {
      externalId: `DEL-${Date.now()}`,
      customerId: args.customerId,
      driverId: args.driverId,
      productId: args.productId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerCity: customer.city,
      customerCountry: customer.country,
      latitude: customer.latitude || 0,
      longitude: customer.longitude || 0,
      status: "Pending" as const,
      priority: args.priority,
      estimatedDeliveryTime: args.estimatedDeliveryTime,
      notes: args.notes,
      orderValue: product.price,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Product queries and mutations
export const listProducts = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query("products").collect();
  },
});

export const createProduct = mutation({
  args: {
    title: v.string(),
    price: v.number(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    inStock: v.boolean(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const now = new Date().toISOString();
    return await ctx.db.insert("products", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateProduct = mutation({
  args: {
    id: v.id("products"),
    title: v.string(),
    price: v.number(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    inStock: v.boolean(),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { id, ...updateData } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: now,
    });
    
    return true;
  },
});

// Driver queries and mutations
export const listDrivers = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    return await ctx.db.query("drivers").collect();
  },
});

export const createDriver = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    vehicleType: v.union(
      v.literal("car"),
      v.literal("bike"),
      v.literal("scooter"),
      v.literal("van")
    ),
    licenseNumber: v.optional(v.string()),
    password: v.optional(v.string()),
    areaCoverage: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const now = new Date().toISOString();
    // Generate a default password if not provided (last 4 digits of phone)
    const defaultPassword = args.password || args.phone.slice(-4);
    
    return await ctx.db.insert("drivers", {
      ...args,
      password: defaultPassword,
      isActive: true,
      rating: 5.0,
      totalDeliveries: 0,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const updateDriver = mutation({
  args: {
    id: v.id("drivers"),
    name: v.string(),
    phone: v.string(),
    vehicleType: v.union(
      v.literal("car"),
      v.literal("bike"),
      v.literal("scooter"),
      v.literal("van")
    ),
    licenseNumber: v.optional(v.string()),
    password: v.optional(v.string()),
    areaCoverage: v.optional(v.string()),
    isActive: v.boolean(),
    rating: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { id, ...updateData } = args;
    const now = new Date().toISOString();
    
    await ctx.db.patch(id, {
      ...updateData,
      updatedAt: now,
    });
    
    return true;
  },
});

export const updateOrder = mutation({
  args: {
    id: v.id("deliveries"),
    status: v.union(v.literal("Pending"), v.literal("On Way"), v.literal("Delivered")),
    priority: v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent")),
    notes: v.optional(v.string()),
    productId: v.optional(v.id("products")),
    driverId: v.optional(v.id("drivers")),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const { id, productId, driverId, status, priority, notes, latitude, longitude } = args;
    const now = new Date().toISOString();
    
    const updateData: any = {
      status,
      priority,
      notes,
      driverId,
      updatedAt: now,
    };
    
    // Only include latitude/longitude if they are provided
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    
    // If productId is being updated, fetch the new product details
    if (productId) {
      const product = await ctx.db.get(productId);
      if (!product) {
        throw new Error("Product not found");
      }
      
      updateData.productId = productId;
      updateData.orderValue = (product as any).price;
    }
    
    await ctx.db.patch(id, updateData);
    
    return true;
  },
});

export const createOrder = mutation({
  args: {
    customerId: v.id("customers"),
    productId: v.id("products"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    notes: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const [customer, product] = await Promise.all([
      ctx.db.get(args.customerId),
      ctx.db.get(args.productId),
    ]);

    if (!customer || !product) {
      throw new Error("Customer or product not found");
    }

    const now = new Date().toISOString();
    
    return await ctx.db.insert("deliveries", {
      externalId: `ORD-${Date.now()}`,
      customerId: args.customerId,
      productId: args.productId,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerCity: customer.city,
      customerCountry: customer.country,
      latitude: args.latitude ?? customer.latitude ?? 0,
      longitude: args.longitude ?? customer.longitude ?? 0,
      status: "Pending" as const,
      priority: args.priority,
      notes: args.notes,
      orderValue: product.price,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const assignDriverToOrder = mutation({
  args: {
    orderId: v.id("deliveries"),
    driverId: v.id("drivers"),
    priority: v.union(
      v.literal("low"),
      v.literal("medium"),
      v.literal("high"),
      v.literal("urgent")
    ),
    notes: v.optional(v.string()),
  },
  handler: async (ctx: MutationCtx, args) => {
    const [order, driver] = await Promise.all([
      ctx.db.get(args.orderId),
      ctx.db.get(args.driverId),
    ]);

    if (!order || !driver) {
      throw new Error("Order or driver not found");
    }

    const now = new Date().toISOString();
    
    await ctx.db.patch(args.orderId, {
      driverId: args.driverId,
      priority: args.priority,
      notes: args.notes,
      updatedAt: now,
    });
    
    return true;
  },
});

// Migration to fix deliveries without customerId or productId
export const fixDeliveriesSchema = mutation({
  args: {},
  handler: async (ctx: MutationCtx) => {
    const deliveries = await ctx.db.query("deliveries").collect();
    const customers = await ctx.db.query("customers").collect();
    const products = await ctx.db.query("products").collect();
    
    let fixedCount = 0;
    
    for (const delivery of deliveries) {
      const updates: any = {};
      let needsUpdate = false;
      
      // Fix missing customerId
      if (!delivery.customerId) {
        // Try to find a matching customer by phone or name
        const matchingCustomer = customers.find(
          customer => 
            customer.phone === delivery.customerPhone || 
            customer.name === delivery.customerName
        );
        
        if (matchingCustomer) {
          updates.customerId = matchingCustomer._id;
        } else {
          // Create a new customer for this delivery
          const newCustomerId = await ctx.db.insert("customers", {
            name: delivery.customerName,
            phone: delivery.customerPhone,
            address: delivery.customerAddress,
            city: delivery.customerCity,
            country: delivery.customerCountry,
            totalOrders: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          updates.customerId = newCustomerId;
        }
        needsUpdate = true;
      }
      
      // Fix missing productId
      if (!delivery.productId) {
        // Find a default product or create one
        let defaultProduct = products.find(p => p.title.toLowerCase().includes('default') || p.title.toLowerCase().includes('general'));
        
        if (!defaultProduct) {
          // Create a default product
          const defaultProductId = await ctx.db.insert("products", {
            title: "General Delivery Item",
            price: delivery.orderValue || 0,
            description: "Default product for legacy deliveries",
            category: "General",
            inStock: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          updates.productId = defaultProductId;
        } else {
          updates.productId = defaultProduct._id;
        }
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        updates.updatedAt = new Date().toISOString();
        await ctx.db.patch(delivery._id, updates);
        fixedCount++;
      }
    }
    
    return { success: true, fixedCount, totalDeliveries: deliveries.length };
  },
});

// Admin stats
export const getAdminStats = query({
  args: {},
  handler: async (ctx: QueryCtx) => {
    const [customers, products, drivers, deliveries] = await Promise.all([
      ctx.db.query("customers").collect(),
      ctx.db.query("products").collect(),
      ctx.db.query("drivers").collect(),
      ctx.db.query("deliveries").collect(),
    ]);

    const activeDrivers = drivers.filter(d => d.isActive).length;
    const pendingDeliveries = deliveries.filter(d => d.status === "Pending" || d.status === "On Way").length;
    const completedDeliveries = deliveries.filter(d => d.status === "Delivered").length;

    return {
      totalCustomers: customers.length,
      totalProducts: products.length,
      totalDrivers: drivers.length,
      activeDrivers,
      pendingDeliveries,
      completedDeliveries,
    };
  },
});