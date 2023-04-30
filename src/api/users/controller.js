import {ADMIN, User} from './model';
import {Follow} from "../follow/model";
import {Participant} from '../participants/model';
import {Event} from '../events/model';
import {Post} from '../posts/model';
import {Like} from '../likes/model';
import {Scan} from '../scans/model';


import {Types} from "mongoose";
import mongoose from "mongoose";

import {uploadToS3} from "../../services/upload";
import _ from 'lodash';

const actions = {};

import { sendPushNotificationToUser } from "../../services/notifications";
import {NOTIFICATIONS_TYPES} from "../notifications/model";


actions.index = async function ({ querymen: { query, cursor } }, res) {
	const newQuery = {
		...query,
		isDeleted: false,
	}
  const data = await User.find(newQuery)
	.skip(cursor.skip)
	.sort({'name': 1, '_id': 1})
	.limit(cursor.limit)
	.sort(cursor.sort);

  const totalData = await User.countDocuments(newQuery);
  res.send({ data, totalData });
};

actions.showMe = async ({ user }, res) => {

	const events = await Event.countDocuments({organiserId: user._id})
	const followers = await Follow.countDocuments({followedId: user._id})
	const followed = await Follow.countDocuments({ followerId: user._id })
	const posts = await Post.countDocuments({ userId: user.id })

	res.send({ ...user._doc, events, followers, followed, posts});

};

actions.show = async function ({ user, params: { userId }, res }) {
	const events = await Event.countDocuments({organiserId: userId})
  const userCheck = await User.findById(id).lean();
  const followers = await Follow.countDocuments({ followedId: userId });
  const followed = await Follow.countDocuments({ followerId: userId });
	const posts = await Post.countDocuments({ userId: user.userId })


  const isFollowing = !!(await Follow.findOne({
    followerId: mongoose.Types.ObjectId(user._id),
    followedId: mongoose.Types.ObjectId(id)
  }).limit(1));

  if (!userCheck) {
    return res.status(404).send();
  }

  res.send({
    ...userCheck,
		events,
    followers,
    followed,
		posts,
    isFollowing,
  });
};

actions.getUserField = async function ({ params: { userFieldId }, querymen: { cursor, query }}, res) {
  const user = await User.findById(userFieldId).select(query.field)

  res.send({user});
};

actions.checkField = async function ({ querymen: { cursor, query }}, res) {

  const user = await User.find({username : query.value}).select('_id')
  if(user){
    res.send({message : true});

  } else{
    res.send({message : false});
  }
}



actions.showEventsForUser = async function ({ params: { id }, querymen: { cursor} }, res) {

  const match = { userId: mongoose.Types.ObjectId(id) };
  const pipeline = [
		{ $match: match },
		{ $lookup: { from: 'events', localField: 'eventId', foreignField: '_id', as: 'event' } },
		{ $unwind: '$event' },
		{ $replaceRoot: { newRoot: '$event' } },
		{ $lookup: { from: 'users', localField: 'organiserId', foreignField: '_id', as: 'organiser' } },
		{ $unwind: '$organiser' },
		{ $addFields: { 'organiser.password': undefined } },
		{ $lookup: { from: 'participants', localField: '_id', foreignField: 'eventId', as: 'participants' } },
		{ $addFields: { participants: { $size: '$participants' } } },
		{ $project: { numParticipants: 0 } },
		{ $match: { isDeleted: { $ne: true } } }, 
		{ $sort: { date: 1, _id: 1 } },
		{
      $lookup: {
        from: 'likes',
        let: { eventId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$type', 'event'] },
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
          $in: [mongoose.Types.ObjectId(id), '$likes.userId']
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
      $project: {
        _id: 1,
        organiserId: 1,
				date: 1,
        name: 1,
        description: 1,
        position: 1,
        address: 1,
        coverImage: 1,
        participants: 1,
				likes: 1, 
				hasLiked: 1,
        organiser: {
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
		Participant.aggregate(pipeline),
		Participant.aggregate([
			{
				$match: match
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
				$unwind: '$event'
			},
			{
				$match: {
					'event.isDeleted': { $ne: true }
				}
			},
			{
				$count: 'count'
			}
		])
	]);
	
	const totalData = count.length ? count[0].count : 0;
	
  res.send({ data, totalData });
};

actions.showPostsForUser = async function ({ user, params: { id }, querymen: { cursor, query } }, res) {

  const match = { userId: mongoose.Types.ObjectId(id) };

  const pipeline = [
    { $match: match },
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
      $sort: { createdAt: -1, _id: 1 }
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
    }
  ];

  const [data, count] = await Promise.all([
    Post.aggregate(pipeline),
    Post.aggregate([{ $match: match }, { $count: 'count' }]),
  ]);
	const totalData = count.length ? count[0].count : 0;

  res.send({ data, totalData });
};


actions.followed = async function ({ params: { id }, querymen: { query, cursor } }, res) {
  const { search, role } = query;

	const match = {
		followerId: Types.ObjectId(id)
	};
	const secondMatch = {
		$and: [
			match,
			{ "followed.role": role || { $exists: true }},
			search ? {
				$or: [
					{ "followed.name": { $regex: new RegExp(`.*${search}.*`, "i") } },
					{ "followed.username": { $regex: new RegExp(`.*${search}.*`, "i") } }
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
        localField: "followedId",
        foreignField: "_id",
        as: "followed"
      }
    },
    {
      $unwind: "$followed"
    },
    {
      $match: secondMatch 
    },
		{ $sort: { "followed.name": 1, "followed._id": 1 }},
		{
      $project: {
        _id: 1,
        followedId: 1,
				followerId: 1,
        followed: {
          _id: 1,
          name: 1,
          username: 1,
          profilePic: 1,
        }
      }
    },
		{ $skip: cursor.skip },
		{ $limit: cursor.limit },
  ];


	const [data, count] = await Promise.all([
		Follow.aggregate(pipeline),
		Follow.aggregate([
			{ $match: match },
			{
				$lookup: {
					from: "users",
					localField: "followedId",
					foreignField: "_id",
					as: "followed"
				}
			},
			{ $unwind: "$followed" },
			{ $match: secondMatch },
			{ $count: 'count' }
		]),
	]);

	const totalData = count.length ? count[0].count : 0;

  res.send({ data, totalData })
};

actions.followers = async function ({ params: { id }, querymen: { query, cursor } }, res) {
	const { search } = query;
	const match = {
		followedId: Types.ObjectId(id)
	};
	const secondMatch = {
		$and: [
			match,
			search ? {
				$or: [
					{ "follower.name": { $regex: new RegExp(`.*${search}.*`, "i") } },
					{ "follower.username": { $regex: new RegExp(`.*${search}.*`, "i") } }
				]
			} : {}
		]
	};
	
	const pipeline = [
		{ $match: match },
		{
			$lookup: {
				from: "users",
				localField: "followerId",
				foreignField: "_id",
				as: "follower"
			}
		},
		{ $unwind: "$follower" },
		{ $match: secondMatch },
		{ $sort: { "follower.name": 1, "_id": 1 }},
		{
      $project: {
        _id: 1,
        followedId: 1,
				followerId: 1,
        follower: {
          _id: 1,
          name: 1,
          username: 1,
          profilePic: 1,
        }
      }
    },
		{ $skip: cursor.skip },
		{ $limit: cursor.limit }
	];
	
	const [data, count] = await Promise.all([
		Follow.aggregate(pipeline),
		Follow.aggregate([
			{ $match: match },
			{
				$lookup: {
					from: "users",
					localField: "followerId",
					foreignField: "_id",
					as: "follower"
				}
			},
			{ $unwind: "$follower" },
			{ $match: secondMatch },
			{ $count: 'count' }
		]),
	]);
	
	const totalData = count.length ? count[0].count : 0;
	res.send({ data, totalData });
	
};

actions.recommended = async function ({ user, querymen: { query, cursor } }, res) {
  const authenticatedUser = user._id;

  const followDocs = await Follow.find({ followerId: authenticatedUser });
  const followedIds = followDocs.map(doc => doc.followedId);

	console.log("FOLLOWED", followedIds);
	const notFollowedIds = await User.find({
    _id: { $nin: followedIds.concat(authenticatedUser) },
    isDeleted: false
  }).distinct('_id');

	console.log("", followedIds);

  const newQuery = {
    ...query,
    _id: { $in: notFollowedIds }
  };

  const userCoordinates = user.position.coordinates;
  const geoNearStage = {
    $geoNear: {
      near: { type: "Point", coordinates: userCoordinates },
      distanceField: "distance",
      maxDistance: 75000, // in meters
      spherical: true,
      query: newQuery,
      key: "position",
    }
  };
	const pipeline = [
		geoNearStage,
		{ $sort: cursor.sort || { name: 1, _id: 1 } },
		{
      $project: {
        _id: 1,
        name: 1,
        username: 1,
        profilePic: 1,
				expoPushToken: 1,
      }
    },
		{ $skip: cursor.skip },
		{ $limit: cursor.limit }
	];
	

  const countPipeline = [geoNearStage, { $count: 'count' }];
  const [data, count] = await Promise.all([
    User.aggregate(pipeline),
    User.aggregate(countPipeline),
  ]);

  const totalData = count.length ? count[0].count : 0;

  res.send({ data, totalData });
};


actions.follow = async function ({ user, params: { id } }, res) {
	try {
		const follow = await Follow.create({
			followerId: user._id, // segue
			followedId: id, // seguito
		})

		const targetUser = await User.findById(id).select('username name expoPushToken')

		await sendPushNotificationToUser({
			title: `${user.username}`,
      text: `has started following you`,
      type: NOTIFICATIONS_TYPES.NEW_FOLLOW,
      user: targetUser,
			userId: user._id,
      extraData: {
				follow
			},
    });

		res.send(follow);
	} catch (err) {
		if (err.code === 11000) {
			return res.status(409).send({

				valid: false,
				param: 'followerId - followedId',
				message: 'You already follow the user'
			});
		}
		res.status(500).send(err);
	}
};

actions.unfollow = async function ({ user, params: { id } }, res) {
	const follow = await Follow.findOne({
		followerId: user._id, // segue
		followedId: id, // seguito
	})

	if (_.isNil(follow)) {
		return res.status(404).send();
	}

	await follow.delete();
	res.status(204).send();
};


actions.create = async ({ body }, res) => {
  let user;
  try {
    user = await User.create(body)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).send({
        valid: false,
        param: 'email - username',
        message: 'email or username already registered'
      });
    }
  }

  res.send(user);
};

actions.update = ({ body, params, user }, res, next) => {
	return User.findById(params.id === 'me' ? user.id : params.id)
		.then(result => {
			if (body) {
				delete body.password;
			}

			if (!result) {
				return null;
			}

			const isAdmin = user.role === ADMIN;
			const isSelfUpdate = user.id === result.id;
			if (!isSelfUpdate && !isAdmin) {
				res.status(401).json({
					valid: false,
					message: 'You can\'t change other user\'s data'
				});
				return null;
			}
			return result;
		})
		.then(async (user) => {
			if (!user) {
				return null;
			}

			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					user[key] !== body[key]
				) {
					user[key] = null;
					user[key] = body[key];
					user.markModified(key);
				}
			}
			await user.save();


			res.send(user)
		});
};

actions.profilePic = async ( req, res) => {
	let user = await User.findById(req.params.id)

	if (_.isNil(user)) {
		return res.status(404).send();
	}

	if(!req.file){
		res.status(400).send();
	}

	try {
		user.profilePic = await uploadToS3(req.file)
		await user.save()
		res.send(user)
	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
};

actions.updatePassword = ({ body, params, user }, res, next) => {
	return User.findById(params.id === 'me' ? user.id : params.id)
		.then(result => {
			if (!result) {
				return null;
			}

			const isSelfUpdate = user.id === result.id;
			if (!isSelfUpdate && user.role !== 'admin') {
				res.status(401).json({
					valid: false,
					param: 'password',
					message: 'You can\'t change other user\'s password'
				});
				return null;
			}
			return result;
		})
		.then(user => (user ? user.set({ password: body.password }).save() : null))
		.then(user => res.send(user))
};

actions.destroy = async function ({ params: { id } }, res) {
  const user = await User.findById(id);

  if (_.isNil(user)) {
    return res.status(404).send();
  }

  await user.delete();

  res.status(204).send();
};

actions.deleteMe = async function ({ user }, res) {
	console.debug(user)
	if (_.isNil(user)) {
		return res.status(404).send();
	}

	if (user.isDeleted) {
		return res.status(400).send({ message: 'current user is already deleted' });
	}

	const obliteratedUser = await user.obscureFields();
	res.status(200).send(obliteratedUser);
};


actions.analytics = async function({ user, querymen: { query, select, cursor } }, res) {
	const organiserId = user._id;
  const events = await Event.find({organiserId: organiserId});
  const number_events = await Event.countDocuments({organiserId: organiserId})
	const number_followers = await Follow.countDocuments({followedId: user._id})


  const number_participants = await Promise.all(
    events.map(async (event) => {
      const participants = await Participant.find({eventId: event._id});
      return participants.length;
    })
  ).then((participants) => participants.reduce((a, b) => a + b, 0));


  const number_likes = await Promise.all(
    events.map(async (event) => {
      const likes = await Like.find({objectId: event._id});
      return likes.length;
    })
  ).then((likes) => likes.reduce((a, b) => a + b, 0));

    const number_scans = await Promise.all(
    events.map(async (event) => {
      const scans = await Scan.find({eventId: event._id});
      return scans.length;
    })
  ).then((scans) => scans.reduce((a, b) => a + b, 0));

    const number_posts = await Promise.all(
    events.map(async (event) => {
      const posts = await Post.find({eventId: event._id});
      return posts.length;
    })
  ).then((posts) => posts.reduce((a, b) => a + b, 0));

    const average_participants = Math.round(number_participants / number_events);
    const average_scans = Math.round(number_scans / number_events);
    const average_likes = Math.round(number_likes / number_events);
    const average_posts = Math.round(number_posts / number_events);

	// your data in the last months: +10 followers, +10 posts made on your events, +10 people who participated in your  events
	const dateQuery = {};
	if (query.date) {
		if (query.date.$gte) {
			dateQuery.$gte = new Date(query.date.$gte);
		}
		if (query.date.$lte) {
			dateQuery.$lte = new Date(query.date.$lte);
		}
	}

  res.json({
        number_events, 
				number_followers,
        number_participants, 
        number_likes, 
        number_scans, 
        number_posts,
        average_participants,
        average_scans,
        average_likes,
        average_posts
    });

}

actions.percentages = async function({ user, querymen: { query, select, cursor } }, res) {

	// your data in the last months: +10 followers, +10 posts made on your events, +10 people who participated in your  events
	const dateQuery = {};
	if (query.date) {
		if (query.date.$gte) {
			dateQuery.$gte = new Date(query.date.$gte);
		}
		if (query.date.$lte) {
			dateQuery.$lte = new Date(query.date.$lte);
		}
	}

	const organiserId = user._id;
  const events = await Event.find({organiserId: organiserId});
  const number_events = await Event.countDocuments({organiserId: organiserId})
	const number_followers = await Follow.countDocuments({followedId: user._id})


  const number_participants = await Promise.all(
    events.map(async (event) => {
      const participants = await Participant.find({eventId: event._id});
      return participants.length;
    })
  ).then((participants) => participants.reduce((a, b) => a + b, 0));

  const number_likes = await Promise.all(
    events.map(async (event) => {
      const likes = await Like.find({objectId: event._id});
      return likes.length;
    })
  ).then((likes) => likes.reduce((a, b) => a + b, 0));

    const number_scans = await Promise.all(
    events.map(async (event) => {
      const scans = await Scan.find({eventId: event._id});
      return scans.length;
    })
  ).then((scans) => scans.reduce((a, b) => a + b, 0));

    const number_posts = await Promise.all(
    events.map(async (event) => {
      const posts = await Post.find({eventId: event._id});
      return posts.length;
    })
  ).then((posts) => posts.reduce((a, b) => a + b, 0));

    const average_participants = Math.round(number_participants / number_events);
    const average_scans = Math.round(number_scans / number_events);
    const average_likes = Math.round(number_likes / number_events);
    const average_posts = Math.round(number_posts / number_events);
	

  res.json({
        number_events,
				number_followers,
        number_participants, 
        number_likes, 
        number_scans, 
        number_posts,
        average_participants,
        average_scans,
        average_likes,
        average_posts
    });
	
}

export { actions };
