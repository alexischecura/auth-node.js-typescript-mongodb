import { NextFunction, Request, Response } from 'express';
import { AuthenticationError, InternalServerError } from '../utils/AppError';

export const getCurrentUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = res.locals.user;

    if (!user)
      return next(new AuthenticationError('User authentication required'));

    res.status(200).json({
      status: 'success',
      data: {
        user,
      },
    });
  } catch (error) {
    console.error(error);
    next(new InternalServerError('Something went wrong when getting the user'));
  }
};

export const adminTestResponse = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({
    status: 'success',
    message: 'You see this because you are an admin',
  });
};

export const userTestResponse = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  res.json({
    status: 'success',
    message: 'You see this because you are an user',
  });
};
