import { z } from 'zod';

const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':",.<>/?\\|~`])\S{8,}$/;

export const completeProfileSchema = z.object({
  username: z.string().min(8, 'Username must be at least 8 characters.'),
  password: z
    .string()
    .regex(
      PASSWORD_REGEX,
      'Password must include uppercase, lowercase, number, special character, and 8+ characters.'
    ),
  firstName: z.string().min(1, 'First name is required.'),
  lastName: z.string().min(1, 'Last name is required.'),
  phoneNumber: z.string().min(1, 'Phone number is required.'),
  address: z.string().min(1, 'Address is required.'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
});

export type CompleteProfileFormValue = z.infer<typeof completeProfileSchema>;
export type CompleteProfileFieldName = keyof CompleteProfileFormValue;

export const completeProfileAvailabilitySchema = {
  username: z.string().min(8, 'Username must be at least 8 characters.'),
  phoneNumber: z.string().min(1, 'Phone number is required.'),
} as const;

export type CompleteProfileAvailabilityField =
  keyof typeof completeProfileAvailabilitySchema;
