import { Schema, model } from 'mongoose';

const NoteSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

NoteSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

const Note = model('Note', NoteSchema);

export { Note };
