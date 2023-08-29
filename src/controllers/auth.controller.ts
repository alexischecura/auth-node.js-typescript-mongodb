import { NextFunction, Request, Response } from 'express';
import { DocumentType } from '@typegoose/typegoose';
import { ConflictError, InternalServerError } from '../utils/AppError';

import Email from '../utils/Email';
import { User } from '../model/user.model';
import { createUser } from '../services/user.service';

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
