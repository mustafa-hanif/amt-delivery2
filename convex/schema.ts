import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const linkedRecordSchema = v.object({
  id: v.string(),
  title: v.optional(v.string()),
  name: v.optional(v.string()),
  raw: v.optional(v.any()),
});

const statusEnum = v.union(
  v.literal("Pending"),
  v.literal("On Way"),
  v.literal("Delivered")
);

const priorityEnum = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high"),
  v.literal("urgent")
);

const driverTypeEnum = v.union(
  v.literal("car"),
  v.literal("bike"),
  v.literal("scooter"),
  v.literal("van")
);

export default defineSchema({
  deliveries: defineTable({
    externalId: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
    driverId: v.optional(v.id("drivers")),
    productId: v.optional(v.id("products")),
    customerName: v.string(),
    customerPhone: v.string(),
    customerAddress: v.string(),
    customerCity: v.optional(v.string()),
    customerCountry: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    status: statusEnum,
    priority: priorityEnum,
    estimatedDeliveryTime: v.optional(v.string()),
    notes: v.optional(v.string()),
    orderValue: v.optional(v.number()),
    driver: v.optional(linkedRecordSchema),
    product: v.optional(linkedRecordSchema),
    customerRecord: v.optional(linkedRecordSchema),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_status", ["status"])
    .index("by_customer", ["customerId"])
    .index("by_driver", ["driverId"])
    .index("by_product", ["productId"]),

  customers: defineTable({
    name: v.string(),
    phone: v.string(),
    address: v.string(),
    city: v.optional(v.string()),
    country: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    email: v.optional(v.string()),
    totalOrders: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_phone", ["phone"]),

  products: defineTable({
    title: v.string(),
    price: v.number(),
    description: v.optional(v.string()),
    category: v.optional(v.string()),
    inStock: v.boolean(),
    imageUrl: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_category", ["category"]),

  drivers: defineTable({
    name: v.string(),
    phone: v.string(),
    vehicleType: driverTypeEnum,
    licenseNumber: v.optional(v.string()),
    isActive: v.boolean(),
    currentLatitude: v.optional(v.number()),
    currentLongitude: v.optional(v.number()),
    rating: v.optional(v.number()),
    totalDeliveries: v.optional(v.number()),
    createdAt: v.string(),
    updatedAt: v.string(),
  }).index("by_vehicle_type", ["vehicleType"])
    .index("by_active", ["isActive"])
});
