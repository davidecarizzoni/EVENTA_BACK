import { Schema, model } from 'mongoose';

const DiscountSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  eventId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  discountValue:{
    type: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

DiscountSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true
});

DiscountSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Discount = model('Discount', DiscountSchema);

export { Discount };
