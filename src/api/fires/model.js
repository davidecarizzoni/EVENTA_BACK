import { Schema, model } from 'mongoose';

const FireSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  noteId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

FireSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

FireSchema.virtual('note', {
  ref: 'Note',
  localField: 'noteId',
  foreignField: '_id',
  justOne: true
});

const Fire = model('Fire', FireSchema);

export { Fire };
