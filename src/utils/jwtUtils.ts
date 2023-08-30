import jwt, { SignOptions } from 'jsonwebtoken';
import { envVars } from '../configs/env.config';

export const signJwt = (
  payload: Object,
  keyToken: 'ACCESS_TOKEN_PRIVATE_KEY' | 'REFRESH_TOKEN_PRIVATE_KEY',
  options: SignOptions
) => {
  const privateKey = Buffer.from(envVars[keyToken], 'base64').toString('ascii');

  return jwt.sign(payload, privateKey, {
    ...(options && options),
    algorithm: 'RS256',
  });
};

export const verifyJwt = <T>(
  token: string,
  keyToken: 'ACCESS_TOKEN_PUBLIC_KEY' | 'REFRESH_TOKEN_PUBLIC_KEY'
): T | null => {
  try {
    const publicKey = Buffer.from(envVars[keyToken], 'base64').toString(
      'ascii'
    );
    const decoded = jwt.verify(token, publicKey) as T;

    return decoded;
  } catch (error) {
    return null;
  }
};
