import { Schema, model } from 'mongoose';
import mongoose from 'mongoose';


const EventsSchema = new Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
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
  eventImage: {
    type: String,
    default: ''
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
    //required: true,
  }
});

const Event = model('Event', EventsSchema);

export { Event };
