import { Post } from './model';
import {Follow} from "../follow/model";
import {Like} from "../likes/model";
import {User} from "../users/model";
import { Event } from '../events/model';

import _ from 'lodash';
import {uploadToS3} from "../../services/upload";

import mongoose from "mongoose";

import { sendPushNotificationToUser } from '../../services/notifications';
import { NOTIFICATIONS_TYPES } from '../notifications/model';

const actions = {};
const populationOptions = ['user', 'event'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Post.find(query)
  .sort({'createdAt':-1})
  .populate(populationOptions)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
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
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'postId',
        as: 'comments'
      }
    },
    {
      $group: {
        _id: '$_id',
        data: { $first: '$$ROOT' },
        comments: { $sum: { $size: '$comments' } },
        comment: { $first: '$comments' }
      }
    },
    {
      $addFields: {
        'data.comments': '$comments',
        'data.comment': { $arrayElemAt: ['$comment', 0] }
      }
    },
    {
      $replaceRoot: { newRoot: '$data' }
    },
    
    {
      $addFields: {
        event: { $arrayElemAt: ['$event', 0] },
        user: { $arrayElemAt: ['$user', 0] },
      }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $project: {
        _id: 1,
        userId: 1,
        eventId: 1,
        caption: 1,
        postImage: 1,
        likes: 1,
        createdAt: 1,
        hasLiked: 1,
        event: {
          _id: 1,
          name: 1,
        },
        user: {
          _id: 1,
          name: 1,
          username: 1,
          profilePic: 1,
          role: 1,
        },
        comments: 1,
        comment: {
          _id: 1,
          userId: 1,
          postId: 1,
          content: 1,
        },
      }
    },
    {
      $skip: cursor.skip
    },
    {
      $limit: cursor.limit
    },

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

		const likedPost = await Post.findById(id)
		const targetUser = await User.findById(likedPost.userId).select('username name expoPushToken')

		await sendPushNotificationToUser({
			title: `${user.username}`,
      text: `has liked your post`,
      type: NOTIFICATIONS_TYPES.POST_LIKE,
      user: targetUser,
      userId: user._id,
      extraData: {
				like
			},
    });


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

actions.create = async ({ user, body }, res) => {
  let post;

  try {

    post = await Post.create(body);

		const event = await Event.findById(post.eventId)
		const targetUser = await User.findById(event.organiserId).select('username name expoPushToken')


		await sendPushNotificationToUser({
			title: `${user.username}`,
      text: `has posted on your event`,
      type: NOTIFICATIONS_TYPES.POST_ON_EVENT,
      user: targetUser,
      userId: user._id,
      extraData: {
        post
			},
    });

		res.send(post);

  } catch (err) {
    return null;
  }

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
