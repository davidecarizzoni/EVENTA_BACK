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
  content: {
    type: String,
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
  justOne: true,
  options: {
		projection: {
      _id: 1,
			username: 1,
      name: 1,
			profilePic: 1
		},
	}
});


const Comment = model('Comment', CommentSchema);

export { Comment };
