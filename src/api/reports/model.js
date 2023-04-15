import { Schema, model } from 'mongoose';

const ReportSchema = new Schema({
  objectId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  type: {
    type: String,
    enum: ['event', 'post', 'note', 'user', 'comment'],
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


const Report = model('Report', ReportSchema);

export { Report };
