import { Like } from './model';
import _ from 'lodash';
import mongoose from "mongoose";

const actions = {};
const populationOptions = ['user'];

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const { search } = query;
  console.log("QUERYYYY", query)

  if (query.objectId) {
    query.objectId = mongoose.Types.ObjectId(query.objectId);
  }
  const match = {
    objectId: mongoose.Types.ObjectId(query.objectId)
  }
  
	const secondMatch = {
		$and: [
      match,
			{ "user.isDeleted": { $ne: true } },
			search ? {
				$or: [
          { "user.name": { $regex: new RegExp(`.*${search}.*`, "i") } },
          { "user.username": { $regex: new RegExp(`.*${search}.*`, "i") } }
				]
			} : {}
		]
	};

  const pipeline = [
    {
      $match: match
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $match: secondMatch
    },
    { $sort: { "user.name": 1 } },
    { $skip: cursor.skip },
    { $limit: cursor.limit }
  ];

	const [data, count] = await Promise.all([
		Like.aggregate(pipeline),
		Like.aggregate([
			{ $match: match },
			{
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      {
        $unwind: "$user"
      },
			{ $match: secondMatch },
			{ $count: 'count' }
		]),
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

actions.destroy = async function ({ params: { id } }, res) {
  const like = await Like.findById(id);

  if (_.isNil(like)) {
    return res.status(404).send();
  }

  await like.delete();

  res.status(204).send();
};

export { actions };
