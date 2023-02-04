import { Schema, model } from 'mongoose';

const FollowSchema = new Schema({
  followedId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  followerId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

// FollowSchema.virtual('user', {
//   ref: 'User',
//   localField: 'userId',
//   foreignField: '_id',
//   justOne: true
// });
//
// FollowSchema.virtual('user', {
//   ref: 'User',
//   localField: 'userId',
//   foreignField: '_id',
//   justOne: true
// });


const Follow = model('Follow', FollowSchema);

export { Follow };
