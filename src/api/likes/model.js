import { Schema, model } from 'mongoose';

const LikeSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

LikeSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true
});

PartecipantsSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});



const Like = model('Like', LikeSchema);

export { Like };
