import { Schema, model } from 'mongoose';


const FollowSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: true
      },
      followerId: {
        type: Schema.Types.ObjectId,
        required: true
      },

}, { toJSON: { virtuals: true }, toObject: { virtuals: true } });

FollowSchema.virtual('follower', {
    ref: 'Event',
    localField: 'eventId',
    foreignField: '_id',
    justOne: true
});

  FollowSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});


const Follow = model('Follow', FollowSchema);

export { Follow };