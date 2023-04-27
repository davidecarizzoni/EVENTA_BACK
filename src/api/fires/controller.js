import { Fire } from './model';
import _ from 'lodash';
import mongoose from "mongoose";

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const { search } = query;

  if (query.noteId) {
    query.noteId = mongoose.Types.ObjectId(query.noteId);
  }
  const match = {
    noteId: mongoose.Types.ObjectId(query.noteId)
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
    {
      $project: {
        _id: 1,
        userId: 1,
        noteId: 1,
        user: {
          _id: 1,
          name: 1,
          role: 1,
          username: 1,
          profilePic: 1,
        }
      }
    },
    { $skip: cursor.skip },
    { $limit: cursor.limit }
  ];

	const [data, count] = await Promise.all([
		Fire.aggregate(pipeline),
		Fire.aggregate([
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

  const fire = await Fire
	.findById(id)
	.exec();

  if (!fire) {
    return res.status(404).send();
  }

  res.send(fire);
};

actions.create = async ({ body }, res) => {
  let fire;
  try {
    fire = await Fire.create(body);
  } catch (err) {
    return null; 
  }

  res.send(fire);
};

actions.destroy = async function ({ params: { id } }, res) {
  const fire = await Fire.findById(id);

  if (_.isNil(fire)) {
    return res.status(404).send();
  }

  await fire.delete();

  res.status(204).send();
};

export { actions };
