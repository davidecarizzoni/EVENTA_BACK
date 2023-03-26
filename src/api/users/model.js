import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export const ADMIN = 'admin';
export const USER = 'user';
export const ORGANISER = 'organiser';
export const ROLES = [ADMIN, USER, ORGANISER];

const UsersSchema = new Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    required: true,
  },
  password: {
    type: String,
    minLength: 8,
    required: true,
		select: false
  },
  role: {
    type: String,
    enum: ROLES,
    default: USER
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    unique: true,
    required: true
  },
  bio: {
    type: String,
  },
  profilePic: {
    type: String,
  },
  position: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  address: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  }
});
UsersSchema.index({ position: '2dsphere' });
UsersSchema.pre('save', function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  bcrypt
    .hash(this.password, 10)
    .then((hash) => {
      this.password = hash;
      next();
    })
    .catch(next);
});

UsersSchema.methods.authenticate = async function (password) {
  const user = await User.findById(this._id).select('password');

  if (!user) {
    return false;
  }

  const result = await bcrypt.compare(password, user.password);

  return result ? this : false;
};


const User = model('User', UsersSchema);

export { User };
