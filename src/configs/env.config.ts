import { z } from 'zod';

const numberRegex = /^\d+$/;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']),
  PORT: z.string().regex(numberRegex).transform(Number),
  ORIGIN: z.string(),
  RATE_LIMIT_TIME_IN_SECONDS: z.string().regex(numberRegex).transform(Number),

  EMAIL_USER: z.string(),
  EMAIL_PASS: z.string(),
  EMAIL_HOST: z.string(),
  EMAIL_PORT: z.string().regex(numberRegex).transform(Number),
  EMAIL_FROM: z.string(),

  MONGO_VERSION: z.string(),
  MONGO_USER: z.string(),
  MONGO_PASSWORD: z.string(),
  MONGO_DB: z.string(),
  MONGO_PORT: z.string().regex(numberRegex).transform(Number),
  MONGO_URL: z.string(),

  REDIS_VERSION: z.string(),
  REDIS_URL: z.string(),
  REDIS_PORT: z.string().regex(numberRegex).transform(Number),
  REDIS_CACHE_EXPIRES: z.string().regex(numberRegex).transform(Number),
});

export const envVars = envSchema.parse(process.env);
