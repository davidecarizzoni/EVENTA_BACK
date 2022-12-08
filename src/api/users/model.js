const mongoose = require ('mongoose');
const bcrypt = require('bcrypt');

const Schema = mongoose.Schema;

const UsersSchema = Schema({
  email: {
    type: String,
    unique: true,
    lowercase: true,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    minlenght: 8,
    select: false,
    required: true
  },
  role: {
    type: String,
    default: "user"
  },
  name: {
    type: String,
    required: true
  },
  username: {
    type: String,
    trim: true,
    minlenght: 4,
    maxlenght: 16,
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

UsersSchema.pre('save', async function(next) {
  const user = this;
  const hash = await bcrypt.hash(this.password, 10); //await has no effect

  this.password = hash;
  next();

});

UsersSchema.methods.isValidPassword = async function(password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);
  
  return compare;
}


module.exports = mongoose.model('User', UsersSchema);