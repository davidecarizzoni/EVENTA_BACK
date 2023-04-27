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
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

NoteSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  options: {
		projection: {
      _id: 1,
			username: 1,
      name: 1,
			profilePic: 1
		},
	}
});

NoteSchema.virtual('fires', {
  ref: 'Fire',
  localField: '_id',
  foreignField: 'noteId',
  justOne: false,
  count: true
});

const Note = model('Note', NoteSchema);

export { Note };
