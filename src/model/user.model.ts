import {
  Severity,
  getModelForClass,
  index,
  modelOptions,
  pre,
  prop,
} from '@typegoose/typegoose';
import bcrypt from 'bcryptjs';

@pre<User>('save', async function (next) {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 12);
  next;
})

@pre<User>(/^find/, function (next) {
  this.find({ active: { $ne: false } });
  next();
})
@index({ email: 1, verificationCode: 1 })
@modelOptions({
  schemaOptions: {
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})

export enum UserRole {
  USER= 'user',
  ADMIN = 'admin'
}

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
}

const UserModel = getModelForClass(User);

export default UserModel;
