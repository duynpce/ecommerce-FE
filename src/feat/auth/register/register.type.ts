import { z } from 'zod';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>/?\\|~`])\S{8,}$/;

export const usernameSchema = z
  .string()
  .min(8, 'Username must be at least 8 characters.');

export const passwordSchema = z
  .string()
  .regex(
    PASSWORD_REGEX,
    'Password must include uppercase, lowercase, number, special character, and 8+ characters.'
  );

export const emailSchema = z
  .string()
  .email('Email is invalid.');

export const nonEmptyTextSchema = (label: string) =>
  z.string().min(1, `${label} is required.`);

export const genderSchema = z.enum(['MALE', 'FEMALE', 'OTHER']);

export const registerSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
  email: emailSchema,
  firstName: nonEmptyTextSchema('First name'),
  lastName: nonEmptyTextSchema('Last name'),
  phoneNumber: nonEmptyTextSchema('Phone number'),
  address: nonEmptyTextSchema('Address'),
  gender: genderSchema,
});

export type RegisterFormValue = z.infer<typeof registerSchema>;
export type RegisterFieldName = keyof RegisterFormValue;

export const availabilitySchema = {
  username: usernameSchema,
  email: emailSchema,
  phoneNumber: nonEmptyTextSchema('Phone number'),
} as const;

export type AvailabilityField = keyof typeof availabilitySchema;
