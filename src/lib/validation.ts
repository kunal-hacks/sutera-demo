import { z } from "zod";

export const checkoutSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your full name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"),
  address: z.string().trim().min(5, "Enter your full address"),
  city: z.string().trim().min(2, "Enter your city"),
  state: z.string().trim().min(2, "Enter your state"),
  pincode: z.string().trim().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
  paymentMethod: z.enum(["RAZORPAY", "COD"]),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().int().min(1).max(20),
      })
    )
    .min(1, "Your cart is empty"),
});

export const trackOrderSchema = z.object({
  orderNumber: z.string().trim().min(5, "Enter your order ID"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter the 10-digit mobile number used at checkout"),
});

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Enter your name"),
  email: z.string().trim().email("Enter a valid email address"),
  phone: z.string().trim().optional(),
  message: z.string().trim().min(10, "Tell us a little more (min 10 characters)"),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(6),
});

export const productSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers and hyphens only"),
  shortDescription: z.string().trim().min(5),
  description: z.string().trim().min(10),
  price: z.number().int().positive(),
  mrp: z.number().int().positive(),
  stock: z.number().int().min(0),
  material: z.string().optional(),
  dimensions: z.string().optional(),
  firmness: z.string().optional(),
  sleepPosition: z.string().optional(),
  weight: z.string().optional(),
  coverType: z.string().optional(),
  status: z.enum(["ACTIVE", "DRAFT", "ARCHIVED"]),
});

export const orderStatusSchema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
  note: z.string().optional(),
});
