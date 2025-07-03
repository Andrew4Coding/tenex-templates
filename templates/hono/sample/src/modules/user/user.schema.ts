import { z } from 'zod';

export const userBaseSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  image: z.string().url().optional().nullable(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  isAlreadyVoted: z.boolean().optional(),
});

export const userCreateSchema = userBaseSchema.extend({
  password: z.string().min(6),
});

export const userUpdateSchema = userBaseSchema.partial();

export const userQuerySchema = z.object({
  id: z.string(),
});

export const userSchema = z.object({}); // For list/query params if needed

export const userResponseSchema = userBaseSchema.extend({
  id: z.string(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type UserBaseSchema = z.infer<typeof userBaseSchema>;
export type UserCreateSchema = z.infer<typeof userCreateSchema>;
export type UserUpdateSchema = z.infer<typeof userUpdateSchema>;
export type UserQuerySchema = z.infer<typeof userQuerySchema>;
export type UserResponseSchema = z.infer<typeof userResponseSchema>;
