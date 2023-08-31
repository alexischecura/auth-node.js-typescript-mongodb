import { NextFunction, Request, Response } from 'express';
import { UserRole } from '../model/user.model';
import { AuthenticationError, AuthorizationError } from '../utils/AppError';

// Route Restriction Depending on User Role
export const restrictTo =
  (...roles: UserRole[]) =>
  (req: Request, res: Response, next: NextFunction) => {
    const user = res.locals.user;

    if (!user) return next(new AuthenticationError('Session has expired'));
    console.log(roles);
    console.log(user.role);

    if (!roles.includes(user.role)) {
      return next(
        new AuthorizationError(
          'You do not have permission to perform this action'
        )
      );
    }
    next();
  };
