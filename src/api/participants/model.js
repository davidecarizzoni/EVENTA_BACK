import { Schema, model } from 'mongoose';

const ParticipantsSchema = new Schema({
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
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

ParticipantsSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
  options: {
		projection: {
      _id: 1,
			profilePic: 1,
      username: 1,
      name: 1,
		},
	}
});

const Participant = model('Participant', ParticipantsSchema);

export { Participant };
