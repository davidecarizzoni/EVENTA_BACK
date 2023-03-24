import { Like } from './model';
import { Event } from '../events/model';
import _ from 'lodash';


import mongoose from "mongoose";
import {Types} from "mongoose";

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Like.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.exec();

  const totalData = await Like.countDocuments(query);

  res.send({ data, totalData });
};

actions.showLikedEventsForUser = async function ({ user, querymen: { cursor } }, res) {
  const match = { userId: mongoose.Types.ObjectId(user._id) };
  const pipeline = [
    { $match: match },
    { $lookup: { from: 'events', localField: 'eventId', foreignField: '_id', as: 'event' } },
    { $unwind: '$event' },
    { $replaceRoot: { newRoot: '$event' } },
    { $lookup: { from: 'users', localField: 'organiserId', foreignField: '_id', as: 'organiser' } },
    { $unwind: '$organiser' },
    { $addFields: { 'organiser.password': undefined } },
    { $lookup: { from: 'likes', localField: '_id', foreignField: 'eventId', as: 'likes' } },
    { $addFields: { likes: { $size: '$likes' } } },
    { $lookup: { from: 'participants', localField: '_id', foreignField: 'eventId', as: 'participants' } },
    { $addFields: { participants: { $size: '$participants' } } },
    { $project: { numLikes: 0, numParticipants: 0 } },
    { $sort: { date: 1 } },
    { $skip: cursor.skip },
    { $limit: cursor.limit }
  ];

  const [data, count] = await Promise.all([
    Like.aggregate(pipeline),
    Like.aggregate([{ $match: match }, { $count: 'count' }]),
  ]);

  const totalData = count.length ? count[0].count : 0;
  res.send({ data, totalData });
};



actions.show = async function ({ params: { id } }, res) {

  const like = await Like
	.findById(id)
	.exec();

  if (!like) {
    return res.status(404).send();
  }

  res.send(like);
};

actions.create = async ({ body }, res) => {
  let like;
  try {
    like = await Like.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(like);
};

actions.update = ({ body, params }, res) => {
	return Like.findById(params.id)
		.then(async (like) => {
			if (!like) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					like[key] !== body[key]
				) {
					like[key] = null;
					like[key] = body[key];
					like.markModified(key);
				}
			}
			await like.save();

			res.send(like);
		});
};

actions.destroy = async function ({ params: { id } }, res) {
  const like = await Like.findById(id);

  if (_.isNil(like)) {
    return res.status(404).send();
  }

  await like.delete();

  res.status(204).send();
};

export { actions };
