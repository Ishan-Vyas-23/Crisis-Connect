const { z } = require('zod');

const registerSchema = z.object({
  name: z.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .trim(),
  email: z.string()
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string()
    .email("Invalid email address")
    .trim()
    .toLowerCase(),
  password: z.string()
    .min(1, "Password is required")
});

module.exports = {
  registerSchema,
  loginSchema
};
