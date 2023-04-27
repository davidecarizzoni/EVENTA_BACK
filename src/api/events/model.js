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
    city: {
      type: String,
    },
    fullAddress: {
      type: String,
      required: true,
    },
  },
  date: {
    type: Date,
    required: true,
  },
  coverImage: {
		type: String,
  },
  discount: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
  },
  isDeleted: {
		type: Boolean,
		default: false
	}
}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

EventsSchema.index({ position: '2dsphere' });

EventsSchema.methods.obscureFields = async function () {
	console.log(this)
	this.isDeleted = true;
  this.name = "Event Deleted"
  this.coverImage = null
  this.description = "Event Deleted"

	return this.save();
};

EventsSchema.virtual('organiser', {
  ref: 'User',
  localField: 'organiserId',
  foreignField: '_id',
  justOne: true,
	options: {
		projection: {
      _id: 1,
			name: 1,
			username: 1,
			profilePic: 1
		},
	}
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
