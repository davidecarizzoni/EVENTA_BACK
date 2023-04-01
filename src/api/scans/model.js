import { Schema, model } from 'mongoose';

const ScanSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  eventId: {
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

ScanSchema.virtual('event', {
  ref: 'Event',
  localField: 'eventId',
  foreignField: '_id',
  justOne: true
});

ScanSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Scan = model('Scan', ScanSchema);

export { Scan };
