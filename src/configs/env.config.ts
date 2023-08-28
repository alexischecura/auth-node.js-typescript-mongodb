import { z } from 'zod';

const numberRegex = /^\d+$/;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().regex(numberRegex).transform(Number),
  ORIGIN: z.string(),
  RATE_LIMIT_TIME_IN_SECONDS: z.string().regex(numberRegex).transform(Number),
});

export const envVars = envSchema.parse(process.env);
