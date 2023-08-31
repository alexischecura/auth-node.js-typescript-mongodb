import { CookieOptions, NextFunction, Request, Response } from 'express';
import { DocumentType } from '@typegoose/typegoose';
import crypto from 'crypto';

import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  InternalServerError,
  NotFoundError,
} from '../utils/AppError';
import { envVars } from '../configs/env.config';
import Email from '../utils/Email';

import { User } from '../model/user.model';
import {
  createUser,
  getUser,
  getUserById,
  signTokens,
  updateUser,
} from '../services/user.service';
import { redisClient } from '../utils/connectRedisDB';
import { signJwt, verifyJwt } from '../utils/jwtUtils';

// Signup User

export const createUserHandler = async (
  req: Request<{}, {}, DocumentType<User>>,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fullName, email, password } = req.body;

    const newUser = await createUser({
      fullName,
      email,
      password,
    });
    const verifyCode = await newUser.createVerificationCode();
    await newUser.save();
    // const verificationUrl = `${envVars.ORIGIN}/verification/${verifyCode}`;
    const verificationUrl = `localhost:3000/api/v1/users/verification/${verifyCode}`;

    try {
      await new Email(newUser, verificationUrl).sendVerificationCode();
    } catch (error) {
      return new InternalServerError(
        'There was an error sending the verification email. Please try again later.'
      );
    }

    res.status(201).json({
      status: 'success',
      message: 'A verification link has been sent to your email account.',
    });
  } catch (error: any) {
    console.log(error);
    console.log(error.code);
    if (error.code === 11000) {
      return new ConflictError(
        'A user with this email address already exists.'
      );
    } else {
      return new InternalServerError(
        'There was an error creating the account. Please try again later.'
      );
    }
  }
};

export const verifyEmailHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Params type verification done in routes

    const verificationCode = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await updateUser(
      {
        verificationCode,
        verificationCodeExpires: { $gt: new Date() },
      },
      { verified: true, verificationCode: null, verificationCodeExpires: null }
    );

    if (!user) {
      return next(new AuthenticationError('Invalid verification code'));
    }

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(
      new InternalServerError('Something went wrong when verifying the email')
    );
  }
};

// Login User

// Cookies Configurations
const cookiesOptions: CookieOptions = {
  httpOnly: true,
  sameSite: 'lax',
};

if (envVars.NODE_ENV === 'production') cookiesOptions.secure = true;

const accessTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(Date.now() + envVars.ACCESS_TOKEN_EXPIRES * 60 * 1000),
};

const refreshTokenCookieOptions: CookieOptions = {
  ...cookiesOptions,
  expires: new Date(Date.now() + envVars.REFRESH_TOKEN_EXPIRES * 60 * 1000),
};

export const loginUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Body types verification done in routes
    const { email, password } = req.body;

    // Get the user
    const user = await getUser(
      { email: email.toLowerCase() },
      { _id: true, email: true, password: true, verified: true }
    );

    if (!user) {
      return next(new AuthenticationError('Incorrect email or password'));
    }
    if (!user.verified) {
      return next(new AuthorizationError('Please verify your email'));
    }

    if (!(await user.validatePassword(password))) {
      return next(new AuthenticationError('Incorrect email or password'));
    }

    const { access_token, refresh_token } = await signTokens(user);

    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('refresh_token', refresh_token, refreshTokenCookieOptions);

    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (error) {
    console.error(error);
    next(new InternalServerError('Something went wrong when logging in'));
  }
};

// Refreshing the token (Create and Send Access Token with)
export const refreshAccessTokenHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const errorMessage = 'Failed to refresh access token, please login again.';

  try {
    const refresh_token = req.cookies.refresh_token;
    if (!refresh_token) return next(new AuthorizationError(errorMessage));

    const decoded = verifyJwt<{ sub: string }>(
      refresh_token,
      'REFRESH_TOKEN_PUBLIC_KEY'
    );

    if (!decoded) return next(new AuthorizationError(errorMessage));
    const session = await redisClient.get(decoded.sub);
    if (!session) return next(new AuthorizationError(errorMessage));

    const user = await getUserById(JSON.parse(session).id, {
      _id: true,
    });
    if (!user) return next(new AuthorizationError(errorMessage));

    const access_token = signJwt(
      { sub: user._id },
      'ACCESS_TOKEN_PRIVATE_KEY',
      {
        expiresIn: `${envVars.ACCESS_TOKEN_EXPIRES}m`,
      }
    );

    res.cookie('access_token', access_token, accessTokenCookieOptions);
    res.cookie('logged_in', true, {
      ...accessTokenCookieOptions,
      httpOnly: false,
    });

    res.status(200).json({
      status: 'success',
      access_token,
    });
  } catch (error) {
    console.error(error);
    next(
      new InternalServerError('Something went wrong when refreshing the token.')
    );
  }
};

// Logout

const invalidateSession = async (res: Response, userId?: string) => {
  if (userId) await redisClient.del(userId);
  res.cookie('access_token', '', { maxAge: -1 });
  res.cookie('refresh_token', '', { maxAge: -1 });
  res.cookie('logged_in', '', { maxAge: -1 });
};

// Close user session or sessions
export const logoutUserHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = res.locals.user?.id;

    const logoutAllSessions = req.query.all === 'true';

    await invalidateSession(res, logoutAllSessions ? undefined : userId);
  } catch (error) {
    console.error(error);
    next(new InternalServerError('Something went wrong when logging out.'));
  }
  res.status(200).json({
    status: 'success',
    message: 'User successfully logged out',
  });
};

// Reset Password

// Send reset password link to user email
export const forgotPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = await getUser(
      { email: req.body.email.toLowerCase() },
      { _id: true, email: true, fullName: true, verified: true }
    );

    if (!user) {
      return next(
        new NotFoundError('There is no user with that email address.')
      );
    }

    if (!user.verified) {
      return next(new AuthorizationError('Please verify your email.'));
    }

    const resetCode = await user.createPasswordResetCode();
    await user.save();

    try {
      const resetPasswordUrl = `${envVars.ORIGIN}/api/v1/users/resetPassword/${resetCode}`;

      await new Email(user, resetPasswordUrl).sendPasswordResetCode();

      res.status(200).json({
        status: 'success',
        message: 'You will receive an email to reset your password.',
      });
    } catch (error) {
      await updateUser(
        {
          _id: user._id,
        },
        {
          passwordResetCode: null,
          passwordResetExpires: null,
        }
      );
      console.error(error);
      return next(
        new InternalServerError(
          'Something went wrong when sending the email to reset your password.'
        )
      );
    }
  } catch (error) {
    console.error(error);
    return next(
      new InternalServerError(
        'Something went wrong when handling the forgot password.'
      )
    );
  }
};

//Reset the password
export const resetPasswordHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const passwordResetCode = crypto
      .createHash('sha256')
      .update(req.params.token)
      .digest('hex');

    const user = await getUser(
      {
        passwordResetCode,
        passwordResetExpires: { $gt: new Date() },
      },
      { _id: true }
    );

    if (!user)
      return next(new AuthorizationError('Token is invalid or has expired.'));

    const { password } = req.body;

    user.password = password;
    user.passwordResetCode = null;
    user.passwordResetExpires = null;
    user.save();

    await invalidateSession(res, user.id);

    res.status(202).json({
      status: 'success',
      message: 'Your password was successfully updated',
    });
  } catch (error) {
    console.error(error);
    return next(
      new InternalServerError(
        'Something went wrong when handling the reset password.'
      )
    );
  }
};
