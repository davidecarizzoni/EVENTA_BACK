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
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

FollowSchema.virtual('followed', {
  ref: 'User',
  localField: 'followedId',
  foreignField: '_id',
  justOne: true
});

FollowSchema.virtual('follower', {
  ref: 'User',
  localField: 'followerId',
  foreignField: '_id',
  justOne: true
});
FollowSchema.index({ followedId: 1, followerId: 1}, { unique: true });


const Follow = model('Follow', FollowSchema);

export { Follow };
