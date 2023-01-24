import { Schema, model } from 'mongoose';

const EventsSchema = new Schema({
  organiserId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
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
  partecipants:[{
    type: Schema.Types.ObjectId,
  }]

}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

EventsSchema.virtual('organiser', {
  ref: 'User',
  localField: 'organiserId',
  foreignField: '_id',
  justOne: true
});

EventsSchema.virtual('partecipant', {
  ref: 'Partecipant',
  localField: 'partecipants',
  foreignField: '_id',
  justOne: true
});

const Event = model('Event', EventsSchema);

export { Event };
