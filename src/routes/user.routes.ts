import { Router } from 'express';
import {
  createUserHandler,
  verifyEmailHandler,
} from '../controllers/auth.controller';
import { createUserSchema, tokenParamsSchema } from '../schemas/user.schema';
import { validateBody, validateParams } from '../utils/schemaValidators';

const router = Router();

// Sign Up User
router
  .post('/signup', validateBody(createUserSchema), createUserHandler)
  .get(
    '/verification/:token',
    validateParams(tokenParamsSchema),
    verifyEmailHandler
  );

export default router;
