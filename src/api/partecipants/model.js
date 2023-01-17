import { Schema, model } from 'mongoose';

const PartecipantsSchema = new Schema({
  eventId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

PartecipantsSchema.virtual('event', {
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



const Partecipant = model('Partecipant', PartecipantsSchema);

export { Partecipant };
