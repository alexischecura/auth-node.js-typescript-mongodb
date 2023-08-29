import { NextFunction, Request, Response } from 'express';
import { DocumentType } from '@typegoose/typegoose';
import crypto from 'crypto';
import {
  AuthenticationError,
  ConflictError,
  InternalServerError,
} from '../utils/AppError';

import Email from '../utils/Email';
import { User } from '../model/user.model';
import { createUser, updateUser } from '../services/user.service';

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
