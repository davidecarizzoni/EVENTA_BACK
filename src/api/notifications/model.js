import { Schema, model } from 'mongoose';

export const NOTIFICATIONS_TYPES = {
	NEW_EVENT: 'newEvent',
  NEW_FOLLOW: 'newFollow',
  NEW_COMMENT: 'newComment',
  POST_LIKE: 'postLike',
  NOTE_LIKE: 'noteLike',
  EVENT_LIKE: 'eventLike',
  EVENT_PARTICIPATION: 'eventParticipation',
  POST_ON_EVENT: 'postOnEvent',
}

const NotificationSchema = new Schema({
  senderUserId: {
    type: Schema.Types.ObjectId,
    required: true,
  },
  targetUserId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
	type: {
		type: String,
		enum: [...Object.values(NOTIFICATIONS_TYPES)],
		required: true
	},
	extraData: {
		type: Schema.Types.Mixed
	},
  updatedAt: {
    type: Date,
  }
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

NotificationSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
});

NotificationSchema.virtual('targetUser', {
  ref: 'User',
  localField: 'targetUserId',
  foreignField: '_id',
  justOne: true
});


const Notification = model('Notification', NotificationSchema);

export { Notification };
