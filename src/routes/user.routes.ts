import { Router } from 'express';
import {
  createUserHandler,
  loginUserHandler,
  refreshAccessTokenHandler,
  verifyEmailHandler,
} from '../controllers/auth.controller';
import {
  createUserSchema,
  loginUserSchema,
  tokenParamsSchema,
} from '../schemas/user.schema';
import { validateBody, validateParams } from '../utils/schemaValidators';
import { authenticateUser } from '../middlewares/authenticateUser';
import { getCurrentUser } from '../controllers/user.controller';

const router = Router();

// Sign Up User
router
  .post('/signup', validateBody(createUserSchema), createUserHandler)
  .get(
    '/verification/:token',
    validateParams(tokenParamsSchema),
    verifyEmailHandler
  );

// Login User
router
  .post('/login', validateBody(loginUserSchema), loginUserHandler)
  .post('/refresh', refreshAccessTokenHandler);

router.use(authenticateUser);
router.get('/me', getCurrentUser);

export default router;
