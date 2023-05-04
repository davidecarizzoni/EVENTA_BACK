import { Schema, model } from 'mongoose';

const StorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  contentImage: {
    type: String,
    required: true
  },
  caption: {
    type: String, 
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

StorySchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});


const Story = model('Story', StorySchema);

export { Story };
