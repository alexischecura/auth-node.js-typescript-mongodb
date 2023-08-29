import { FilterQuery, UpdateQuery } from 'mongoose';
import { DocumentType } from '@typegoose/typegoose';
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
