import { CookieOptions, NextFunction, Request, Response } from 'express';
import { DocumentType } from '@typegoose/typegoose';
import crypto from 'crypto';

import {
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  InternalServerError,
} from '../utils/AppError';
import { envVars } from '../configs/env.config';
import Email from '../utils/Email';

import { User } from '../model/user.model';
import {
  createUser,
  getUser,
  signTokens,
  updateUser,
} from '../services/user.service';

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
