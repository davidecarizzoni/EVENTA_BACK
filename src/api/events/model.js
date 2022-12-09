import { Schema, model } from 'mongoose';

const EventsSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: false
  },
  profilePic: {
    type: String,
    required: false,
    default:''
  },
  position: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] },
  },
  address: {
    type: String
}
})



const Event = model('Event', EventsSchema);

export { Event }
