import { Schema, model } from 'mongoose';
import bcrypt from 'bcryptjs';

export const ADMIN = 'admin'
export const USER = 'user'
export const ORGANIZER = 'organizer'
export const ROLES = [ADMIN, USER, ORGANIZER]

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
    required: true
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
    trim: true,
    minLength: 4,
    maxLength: 16,
    required: true
  },
  bio: {
    type: String,
    required: false
  },
  profilePic: {
    type: String,
    required: false,
    default:''
  },
  position: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  address: {
    type: String
  }
})

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


UsersSchema.methods.isValidPassword = async function(password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);

  return compare;
}

UsersSchema.methods.authenticate = async function (password) {
  const user = await User.findById(this._id).select('password');

  if (!user) {
    return false;
  }

  const result = await bcrypt.compare(password, user.password);

  return result ? this : false;
};


const User = model('User', UsersSchema);

export { User }
