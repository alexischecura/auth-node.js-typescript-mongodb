import { Router } from 'express';
import {
  createUserHandler,
  forgotPasswordHandler,
  loginUserHandler,
  logoutUserHandler,
  refreshAccessTokenHandler,
  resetPasswordHandler,
  verifyEmailHandler,
} from '../controllers/auth.controller';
import {
  createUserSchema,
  forgotPasswordSchema,
  loginUserSchema,
  resetPasswordSchema,
  tokenParamsSchema,
} from '../schemas/user.schema';
import { validateBody, validateParams } from '../utils/schemaValidators';
import { authenticateUser } from '../middlewares/authenticateUser';
import {
  adminTestResponse,
  getCurrentUser,
  userTestResponse,
} from '../controllers/user.controller';
import { restrictTo } from '../middlewares/authorizationUser';
import { UserRole } from '../model/user.model';

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

// Password Forgot
router
  .post(
    '/forgotPassword',
    validateBody(forgotPasswordSchema),
    forgotPasswordHandler
  )
  .patch(
    '/resetPassword/:token',
    validateParams(tokenParamsSchema),
    validateBody(resetPasswordSchema),
    resetPasswordHandler
  );

// Authenticated Routes

router.use(authenticateUser);
router.get('/me', getCurrentUser);

// Logout user

router.post('/logout', logoutUserHandler);

router.get('/user', restrictTo(UserRole.USER), userTestResponse);
router.get('/admin', restrictTo(UserRole.ADMIN), adminTestResponse);

export default router;
