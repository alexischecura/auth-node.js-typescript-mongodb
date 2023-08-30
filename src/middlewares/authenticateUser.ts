import { NextFunction, Request, Response } from 'express';
import { AuthenticationError, InternalServerError } from '../utils/AppError';
import { redisClient } from '../utils/connectRedisDB';
import { verifyJwt } from '../utils/jwtUtils';
import { getUserById } from '../services/user.service';

// Authentication Verification
export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    let access_token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      access_token = req.headers.authorization.split(' ').at(1);
    } else if (req.cookies.access_token) {
      access_token = req.cookies.access_token;
    }

    if (!access_token)
      return next(new AuthenticationError('You are not logged.'));

    const decoded = verifyJwt<{ sub: string }>(
      access_token,
      'ACCESS_TOKEN_PUBLIC_KEY'
    );
    if (!decoded)
      return next(
        new AuthenticationError("Invalid token or user doesn't exist.")
      );

    const session = await redisClient.get(decoded.sub);
    if (!session)
      return next(new AuthenticationError('Invalid token or session expired.'));

    const user = await getUserById(JSON.parse(session).id, {
      _id: true,
      fullName: true,
      email: true,
      role: true,
    });

    if (!user)
      return next(new AuthenticationError('Invalid token or session expired.'));

    res.locals.user = user;
    console.log(res.locals.user);
    next();
  } catch (error) {
    console.error(error);
    next(new InternalServerError('Something went wrong when authenticating.'));
  }
};
