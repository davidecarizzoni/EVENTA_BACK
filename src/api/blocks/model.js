import { Schema, model } from 'mongoose';

const BlockSchema = new Schema({
  blockerId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  blockedId: {
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

BlockSchema.virtual('blocker', {
  ref: 'User',
  localField: 'blockerID',
  foreignField: '_id',
  justOne: true
});

BlockSchema.virtual('blocked', {
  ref: 'User',
  localField: 'blockedId',
  foreignField: '_id',
  justOne: true
});


const Block = model('Block', BlockSchema);


export { Block };
