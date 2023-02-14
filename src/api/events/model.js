import { Schema, model } from 'mongoose';

const EventsSchema = new Schema({
  organiserId: {
    type: Schema.Types.ObjectId,
  },
  name: {
    type: String,
  },
  description: {
    type: String,
    required: true
  },
  position: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  address: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  coverImage: {
		type: String,
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  },
  maxDistance: {
    type: Number,
    default: 0,
    min: 0
  },

}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

EventsSchema.index({ position: '2dsphere' });
EventsSchema.virtual('organiser', {
  ref: 'User',
  localField: 'organiserId',
  foreignField: '_id',
  justOne: true
});

EventsSchema.virtual('participants', {
  ref: 'Participant',
  localField: '_id',
  foreignField: 'eventId',
  justOne: false,
  count: true
});

const Event = model('Event', EventsSchema);

export { Event };
