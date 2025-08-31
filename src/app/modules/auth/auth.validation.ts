import { z } from "zod";

// --- CREATE ACCOUNT VALIDATION ---
const createCompany = z.object({
  body: z.object({
    company_name: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format"),
    address: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format"),
    email: z
      .string({ required_error: "Email is required" })
      .email("Invalid email format"),
    phone_number: z.string().optional(),
  }),
});

const createAccount = z.object({
  body: z.object({
    name: z.string({ required_error: "Name is required" }).min(1, "Name cannot be empty"),
    company_id: z.string({ required_error: "Company ID is required" }).optional(),
    email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
    profile_image: z
      .string({ required_error: "Profile image URL is required" })
      .url("Invalid URL format")
      .optional(),
    password: z
      .string({ required_error: "Password is required" })
      .min(6, "Password must be at least 6 characters long"),
    confirmPassword: z
      .string({ required_error: "Confirm password is required" })
      .min(6, "Confirm password must be at least 6 characters long"),
    phone_number: z.string().optional(),
    role: z.enum(["EMPLOYER", "ADMIN", "SUPER_ADMIN"], {
      required_error: "Role is required",
    }),
  }).refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  }),

})
// --- UPDATE USER PROFILE ---
const updateAccount = z.object({
  body: z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    phone_number: z.string().min(10, "Phone number must be at least 10 digits").optional(),
    address: z.string().optional(),
  }),
});


// --- LOGIN ---
const loginZodSchema = z.object({
  body: z.object({
    email: z.string({ required_error: "Email is required" }).email("Invalid email format"),
    password: z.string({ required_error: "Password is required" }),
  }),
});

// --- REFRESH TOKEN ---
const refreshTokenZodSchema = z.object({
  cookies: z.object({
    refreshToken: z.string({ required_error: "Refresh Token is required" }),
  }),
});

const blockUnblockUserZodSchema = z.object({
  body: z.object({
    email: z.string({
      required_error: "Email is required",
    }).email("Invalid email format"),
    role: z.enum(["EMPLOYER", "ADMIN", "SUPER_ADMIN"], {
      required_error: "Role is required",
    }),
    is_block: z.boolean({
      required_error: "is_block flag is required",
    }),
  }),
});

export const AuthValidation = {
  createCompany,
  updateAccount,
  createAccount,
  loginZodSchema,
  refreshTokenZodSchema,
  blockUnblockUserZodSchema
};
