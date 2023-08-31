import { FilterQuery, ProjectionType, UpdateQuery } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';
import { envVars } from '../configs/env.config';
import { redisClient } from '../utils/connectRedisDB';
import { signJwt } from '../utils/jwtUtils';
import UserModel, { User } from '../model/user.model';

export const createUser = async (input: Partial<User>) => {
  return await UserModel.create(input);
};

export const updateUser = async (
  where: FilterQuery<DocumentType<User>>,
  input: UpdateQuery<DocumentType<User>>
) => {
  return await UserModel.findOneAndUpdate(where, input, { new: true });
};

export const getUser = async (
  where: FilterQuery<DocumentType<User>>,
  select?: ProjectionType<DocumentType<User>>
) => {
  return await UserModel.findOne(where, select);
};

export const getUserById = async (
  _id: string,
  select?: ProjectionType<DocumentType<User>>
) => {
  return await UserModel.findById(_id, select);
};

export const signTokens = async (user: DocumentType<User>) => {
  // 1. Create session
  const userSession = { id: user._id, email: user.email };
  redisClient.set(`${user._id}`, JSON.stringify(userSession), {
    EX: envVars.REDIS_CACHE_EXPIRES * 60,
  });

  // 2. Create Access and Refresh tokens
  const access_token = signJwt({ sub: user._id }, 'ACCESS_TOKEN_PRIVATE_KEY', {
    expiresIn: `${envVars.ACCESS_TOKEN_EXPIRES}m`,
  });

  const refresh_token = signJwt(
    { sub: user._id },
    'REFRESH_TOKEN_PRIVATE_KEY',
    {
      expiresIn: `${envVars.REFRESH_TOKEN_EXPIRES}m`,
    }
  );

  return { access_token, refresh_token };
};
