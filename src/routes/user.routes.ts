import { Router } from 'express';
import { createUserHandler } from '../controllers/auth.controller';
import { createUserSchema } from '../schemas/user.schema';
import { validateBody } from '../utils/schemaValidators';

const router = Router();

// Sign Up User
router.post('/signup', validateBody(createUserSchema), createUserHandler);

export default router;
