import {
  Severity,
  getModelForClass,
  index,
  modelOptions,
  pre,
  prop,
} from '@typegoose/typegoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@index({ email: 1, verificationCode: 1 })
@pre<User>('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
})
@pre<User>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
})
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
export class User {
  @prop({ required: true })
  fullName: string;

  @prop({ required: true, lowercase: true, unique: true })
  email: string;

  @prop({ required: true })
  password: string;

  @prop({ default: 'user' })
  role: UserRole;

  @prop({ select: false })
  verificationCode: string | null;

  @prop({ select: false })
  verificationCodeExpires: Date | null;

  @prop({ select: false })
  passwordResetCode: string | null;

  @prop({ select: false })
  passwordResetExpires: Date | null;

  @prop({ select: false, default: false })
  verified: boolean;

  @prop({ select: false, default: true })
  active: boolean;

  async validatePassword(candidatePassword: string) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  async createVerificationCode() {
    const verifyCode = crypto.randomBytes(32).toString('hex');
    this.verificationCode = crypto
      .createHash('sha256')
      .update(verifyCode)
      .digest('hex');
    this.verificationCodeExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return verifyCode;
  }
}

const UserModel = getModelForClass(User);

export default UserModel;
