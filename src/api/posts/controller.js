import { Post } from './model';
import {Follow} from "../follow/model";
import {Like} from "../likes/model";

import _, { matches } from 'lodash';
import {uploadToS3} from "../../services/upload";

import mongoose from "mongoose";
import {Types} from "mongoose";

const actions = {};
const populationOptions = ['user', 'event'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Post.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.populate(populationOptions)
	.exec();

  const totalData = await Post.countDocuments(query);

  res.send({ data, totalData });
};

actions.homePosts = async function({ user, querymen: { query, select, cursor } }, res) {  
  const authenticatedUser = user._id;
  const followDocs = await Follow.find({ followerId: authenticatedUser });
  const followedIds = followDocs.map(doc => doc.followedId);

	const match = {
		$or: [
			{ userId: authenticatedUser },
			{ userId: { $in: followedIds }}
		]
	}

  const pipeline = [
		{
			$match: match
    },
    {
			$lookup: {
				from: 'likes',
				let: { eventId: '$_id' },
				pipeline: [
					{
						$match: {
							$expr: {
								$and: [
									{ $eq: ['$type', 'post'] },
									{ $eq: ['$objectId', '$$eventId'] }
								]
							}
						}
					}
				],
				as: 'likes'
			}
		},
    {
      $addFields: {
        hasLiked: {
          $in: [mongoose.Types.ObjectId(user._id), '$likes.userId']
        }
      }
    },
    {
      $addFields: {
        likes: {
          $cond: {
            if: { $isArray: "$likes" },
            then: { $size: "$likes" },
            else: 0
          }
        },
      },
    },
    {
			$lookup: {
				from: 'events',
				localField: 'eventId',
				foreignField: '_id',
				as: 'event'
			}
		},
		{
			$lookup: {
				from: 'users',
				localField: 'userId',
				foreignField: '_id',
				as: 'user'
			}
		},
		{
			$addFields: {
				event: { $arrayElemAt: ['$event', 0] },
				user: { $arrayElemAt: ['$user', 0] }
			}
		},		
    {
      $sort: { createdAt: -1, _id: 1 }
    },
    {
      $skip: cursor.skip
    },
    {
      $limit: cursor.limit
    }
  ];

  const [data, count] = await Promise.all([
    Post.aggregate(pipeline),
    Post.aggregate([{ $match: match }, { $count: 'count' }]),
  ]);
	const totalData = count.length ? count[0].count : 0;

  res.send({ data, totalData });
};



actions.like = async function ({ user, params: { id } }, res) {

	try {
		const like = await Like.create({
			userId: user._id,
			objectId: id,
			type: 'post'
		})

		res.send(like);
	} catch (err) {
		if (err.code === 11000) {
			return res.status(409)
		}
		res.status(500).send(err);
	}
};

actions.unlike = async function ({ user, params: { id } }, res) {
	const like = await Like.findOne({
    userId: user._id,
    objectId: id,
    type: 'post'
	})

	if (_.isNil(like)) {
		return res.status(404).send();
	}

	await like.delete();
	res.status(204).send();
};

actions.show = async function ({ params: { id } }, res) {

  const post = await Post
	.findById(id)
	.exec();

  if (!post) {
    return res.status(404).send();
  }

  res.send(post);
};

actions.create = async ({ body }, res) => {
  let post;
  try {
    post = await Post.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(post);
};

actions.update = ({ body, params }, res) => {
	return Post.findById(params.id)
		.then(async (post) => {
			if (!post) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					post[key] !== body[key]
				) {
					post[key] = null;
					post[key] = body[key];
					post.markModified(key);
				}
			}
			await post.save();

			res.send(post);
		});
};


actions.postImage = async ( req, res) => {
	let post = await Post.findById(req.params.id)

	if (_.isNil(post)) {
		return res.status(404).send();
	}

	if(!req.file){
		res.status(400).send();
	}

	try {
		post.postImage = await uploadToS3(req.file)
		await post.save()
		res.send(post)
	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
};
actions.destroy = async function ({ params: { id } }, res) {
  const post = await Post.findById(id);

  if (_.isNil(post)) {
    return res.status(404).send();
  }

  await post.delete();

  res.status(204).send();
};

export { actions };
