import { Schema, model } from 'mongoose';

const PostSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  eventId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  postImage: {
    type: String,
  },
  caption: {
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

PostSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true,
  options: {
		projection: {
      _id:1,
      name: 1, 
			coverImage: 1,
		},
	}
});

PostSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  options: {
		projection: {
      _id:1,
      name: 1,
      username: 1,
      role: 1,
			profilePic: 1,
		},
	}
});

const Post = model('Post', PostSchema);

export { Post };
