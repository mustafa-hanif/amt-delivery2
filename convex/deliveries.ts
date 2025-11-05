import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { QueryCtx, MutationCtx } from "./_generated/server";

const statusEnum = v.union(
  v.literal("Pending"),
  v.literal("On Way"),
  v.literal("Delivered"),
  v.literal("No Answer"),
  v.literal("Cancelled")
);

export const list = query({
  args: {
    status: v.optional(statusEnum),
  },
  handler: async (ctx: QueryCtx, args: { status?: "Pending" | "On Way" | "Delivered" | "No Answer" | "Cancelled" }) => {
    const deliveries = await ctx.db.query("deliveries").collect();
    
    // Populate related records (driver, product, customer)
    const populatedDeliveries = await Promise.all(
      deliveries.map(async (delivery: any) => {
        const [driver, product, customer] = await Promise.all([
          delivery.driverId ? ctx.db.get(delivery.driverId) : null,
          delivery.productId ? ctx.db.get(delivery.productId) : null,
          delivery.customerId ? ctx.db.get(delivery.customerId) : null,
        ]);

        return {
          ...delivery,
          driver: driver ? {
            id: driver._id,
            name: (driver as any).name,
            phone: (driver as any).phone,
            raw: driver,
          } : undefined,
          product: product ? {
            id: product._id,
            title: (product as any).title,
            name: (product as any).title,
            raw: product,
          } : undefined,
          customerRecord: customer ? {
            id: customer._id,
            name: (customer as any).name,
            raw: customer,
          } : undefined,
        };
      })
    );
    
    if (!args.status) {
      return populatedDeliveries;
    }
    return populatedDeliveries.filter((delivery: any) => delivery.status === args.status);
  },
});

export const updateStatus = mutation({
  args: {
    _id: v.string(),
    status: statusEnum,
  },
  handler: async (ctx: MutationCtx, args: { _id: string; status: "Pending" | "On Way" | "Delivered" | "No Answer" | "Cancelled" }) => {
    const { _id, status } = args;

    // Convert string ID to proper Convex ID
    const normalizedId = ctx.db.normalizeId("deliveries", _id);
    if (!normalizedId) {
      throw new Error(`Invalid delivery id: ${_id}`);
    }

    const record = await ctx.db.get(normalizedId);
    if (!record) {
      throw new Error(`Delivery ${_id} not found`);
    }
    
    await ctx.db.patch(normalizedId, {
      status,
      updatedAt: new Date().toISOString(),
    });
    
    return true;
  },
});

export const updateDeliveryTime = mutation({
  args: {
    _id: v.string(),
    deliveryTime: v.string(),
  },
  handler: async (ctx: MutationCtx, args: { _id: string; deliveryTime: string }) => {
    const { _id, deliveryTime } = args;

    // Convert string ID to proper Convex ID
    const normalizedId = ctx.db.normalizeId("deliveries", _id);
    if (!normalizedId) {
      throw new Error(`Invalid delivery id: ${_id}`);
    }

    const record = await ctx.db.get(normalizedId);
    if (!record) {
      throw new Error(`Delivery ${_id} not found`);
    }
    
    await ctx.db.patch(normalizedId, {
      deliveryTime,
      updatedAt: new Date().toISOString(),
    });
    
    return true;
  },
});
