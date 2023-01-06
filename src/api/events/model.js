import { Schema, model } from 'mongoose';

const EventsSchema = new Schema({
  organizerId: {
    type: Schema.Types.ObjectId,
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  eventImage: {
    data: Buffer,
    contentType: String
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
  },
  startTime: {
    type: String,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

EventsSchema.virtual('organizer', {
  ref: 'User',
  localField: 'organizerId',
  foreignField: '_id',
  justOne: true
});

const Event = model('Event', EventsSchema);

export { Event };
