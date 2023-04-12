import { Schema, model } from 'mongoose';

const CommentSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  postId: {
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

CommentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

CommentSchema.virtual('post', {
  ref: 'Post',
  localField: 'postId',
  foreignField: '_id',
  justOne: true
});

const Comment = model('Comment', CommentSchema);

export { Comment };
