import {Event} from './model';
import {Participant} from '../participants/model';
import {Like} from '../likes/model';
import {Post} from '../posts/model';
import {User} from "../users/model";
import { Follow } from '../follow/model';

import mongoose from "mongoose";
import {Types} from "mongoose";

import _ from 'lodash';
import {uploadToS3} from "../../services/upload";
import {
	sendPushNotificationToUser,
	sendPushNotificationToUsersGroup
} from "../../services/notifications";

import {NOTIFICATIONS_TYPES} from "../notifications/model";

const actions = {};
const populationOptions = ['organiser', 'participants'];


actions.index = async function({ user, querymen: { query, select, cursor } }, res) {
  if (query.date) {
    if (query.date.$gte) {
      query.date.$gte = new Date(query.date.$gte);
    }
    if (query.date.$lte) {
      query.date.$lte = new Date(query.date.$lte);
    }
  }

  if (query.organiserId) {
    query.organiserId = mongoose.Types.ObjectId(query.organiserId);
  }


  const most_popular = query.popular;

  const newQuery = {
    ...query,
    isDeleted: false,
  };

  delete newQuery.popular;

  const pipeline = [
    {
      $match: newQuery,
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
        from: 'users',
        localField: 'organiserId',
        foreignField: '_id',
        as: 'organiser'
      }
    },
    {
      $addFields: {
        organiser: {
          $arrayElemAt: ['$organiser', 0]
        }
      }
    },
    {
      $lookup: {
        from: 'scans',
        localField: '_id',
        foreignField: 'eventId',
        as: 'scans'
      }
    },
    {
      $addFields: {
        scans: { $size: "$scans" }

      }
    },
    {
      $lookup: {
        from: 'participants',
        localField: '_id',
        foreignField: 'eventId',
        as: 'participants'
      }
    },
    {
      $addFields: {
        participants: { $size: "$participants" }

      }
    },
    {
      $project: {
        _id: 1,
        date: 1,
        organiserId: 1,
        name: 1,
        description: 1,
        position: 1,
        address: 1,
        coverImage: 1,
        participants: 1,
        likes: 1,
        hasLiked: 1,
        scans:1,
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
    { $limit: cursor.limit },
  ];


  if (most_popular) {
    pipeline.push(
      {
        $sort: {
          participants: -1
        }
      },
    );
  } else {
    pipeline.push(

      {
        $sort: {
          date: 1,
          name: 1
        }
      },
    );
  }

  const [data, count] = await Promise.all([
    Event.aggregate(pipeline),
    Event.aggregate([{ $match: newQuery }, { $count: 'count' }]),
  ]);

  const totalData = count.length ? count[0].count : 0;
  res.send({ data, totalData });
};


actions.homeEvents = async function({ user, querymen: { query, select, cursor } }, res) {

  if (query.date) {
    if (query.date.$gte) {
      query.date.$gte = new Date(query.date.$gte);
    }
    if (query.date.$lte) {
      query.date.$lte = new Date(query.date.$lte);
    }
  }
  const userCoordinates = user.position.coordinates;
  const most_popular = query.popular;

  const newQuery = {
    ...query,
    isDeleted: false,
  };

  delete newQuery.popular;

  const geoNearStage = {
    $geoNear: {
      near: { type: "Point", coordinates: userCoordinates },
      distanceField: "distance",
      maxDistance: 150000, // in meters
      spherical: true,
      query: newQuery,
      key: "position",
    }
  };
  const pipeline = [
    geoNearStage,
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
        from: 'users',
        localField: 'organiserId',
        foreignField: '_id',
        as: 'organiser'
      }
    },
    {
      $addFields: {
        organiser: {
          $arrayElemAt: ['$organiser', 0]
        }
      }
    },
    {
      $lookup: {
        from: 'participants',
        localField: '_id',
        foreignField: 'eventId',
        as: 'participants'
      }
    },
    {
      $addFields: {
        participants: { $size: "$participants" }

      }
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
    { $limit: cursor.limit },
  ];


  if (most_popular) {
    pipeline.push(
      {
        $sort: {
          participants: -1
        }
      },
    );
  } else {
    pipeline.push(

      {
        $sort: {
          date: 1,
          name: 1
        }
      },
    );
  }

  const countPipeline = [geoNearStage, { $count: 'count' }];
  const [data, count] = await Promise.all([
    Event.aggregate(pipeline),
    Event.aggregate(countPipeline),
  ]);


  const totalData = count.length ? count[0].count : 0;
  res.send({ data, totalData });
};


actions.show = async function ({ user, params: { id }, querymen: { cursor } }, res) {

  const pipeline = [
    {
      $match: { _id: mongoose.Types.ObjectId(id) }    },
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
        from: 'users',
        localField: 'organiserId',
        foreignField: '_id',
        as: 'organiser'
      }
    },
    {
      $addFields: {
        organiser: {
          $arrayElemAt: ['$organiser', 0]
        }
      }
    },
    {
      $lookup: {
        from: 'scans',
        localField: '_id',
        foreignField: 'eventId',
        as: 'scans'
      }
    },
    {
      $addFields: {
        scans: { $size: "$scans" }

      }
    },
    {
      $lookup: {
        from: 'participants',
        localField: '_id',
        foreignField: 'eventId',
        as: 'participants'
      }
    },
    {
      $addFields: {
        participants: { $size: "$participants" }

      }
    },
    {
      $project: {
        _id: 1,
        organiserId: 1,
        name: 1,
        description: 1,
        position: 1,
        address: 1,
        date: 1,
        discount: 1,
        coverImage: 1,
        likes: 1,
        scans:1,
        participants: 1,
        organiser: {
          _id: 1,
          name: 1,
          role: 1,
          username: 1,
          profilePic: 1,
        }
      }
    },
  ];
  const data = await Event.aggregate(pipeline);


  const isParticipating = await Participant
    .aggregate([
      {
        $match: {
          eventId: mongoose.Types.ObjectId(id),
          userId: mongoose.Types.ObjectId(user._id)
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
        $project: {
          _id: 0,
          isParticipating: { $ne: ['$user', []] }
        }
      },
    ])
    .then((result) => {
      return result.length > 0 && result[0].isParticipating;
    })
    .catch((error) => {
      console.error(error);
      return false;
    });

  res.send({
        event: {
          ...data[0],
          isParticipating
        }
      });
};


actions.showPostsForEvent = async function ({ user, params: { id }, querymen: { cursor } }, res) {

  const match = { eventId: mongoose.Types.ObjectId(id) };

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
      $sort: { createdAt: -1, _id: 1 }
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
      $project: {
        _id: 1,
        eventId: 1,
        createdAt: 1,
        userId: 1,
        caption: 1,
        postImage: 1,
        likes: 1,
        hasLiked: 1,
        comments: 1,
        comment: {
          _id: 1,
          userId: 1,
          postId: 1,
          content: 1,
        },
        event: {
          _id: 1,
          name: 1,
          organiserId: 1, 
          role: 1,
          username: 1,
        },
        user: {
          _id: 1,
          role: 1,
          name: 1,
          username: 1,
          profilePic: 1,
        }
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

actions.showParticipantsForEvent = async function ({ params: { id }, querymen: { query, cursor } }, res) {
  const { search } = query;

  const match = {
    eventId: Types.ObjectId(id)
	};
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
        eventId: 1,
        userId: 1,
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
		Participant.aggregate(pipeline),
		Participant.aggregate([
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

actions.participate = async function ({ user, params: { id } }, res) {

	try {
		const participant = await Participant.create({
			userId: user._id,
			eventId: id,
		})

    const event = await Event.findById(id)

    const targetUser = await User.findById(event.organiserId).select('username name expoPushToken')

		await sendPushNotificationToUser({
			title: `${user.username}`,
      text: `is now participating to your event`,
      type: NOTIFICATIONS_TYPES.EVENT_PARTICIPATION,
      user: targetUser,
      userId: user._id,
      extraData: {
        participant
			},
    });

		res.send(participant);

	} catch (err) {
		if (err.code === 11000) {
			return res.status(409)
		}
		res.status(500).send(err);
	}
};

actions.unparticipate = async function ({ user, params: { id } }, res) {
	const participant = await Participant.findOne({
		userId: user._id,
		eventId: id,
	})

	if (_.isNil(participant)) {
		return res.status(404).send();
	}

	await participant.delete();
	res.status(204).send();
};

actions.like = async function ({ user, params: { id } }, res) {

	try {

		const like = await Like.create({
			userId: user._id,
			objectId: id,
			type: 'event'
		})

    const likedEvent = await Event.findById(id)
    const targetUser = await User.findById(likedEvent.organiserId).select('username name expoPushToken')

		await sendPushNotificationToUser({
			title: `${user.username}`,
      text: `has liked your event`,
      type: NOTIFICATIONS_TYPES.EVENT_LIKE,
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
    type: 'event'
	})

	if (_.isNil(like)) {
		return res.status(404).send();
	}

	await like.delete();
	res.status(204).send();
};


actions.create = async ({ user, body }, res) => {
	let event;
  try {
		event = await Event.create(body)

    // Get list of users to send notification to
    const authenticatedUser = user._id;
    const followerDocs = await Follow.find(
      { followedId: authenticatedUser },
      'followerId'
    )
      .populate({
        path: 'follower',
        select: '_id expoPushToken isDeleted username',
        match: {
          expoPushToken: { $ne: null },
          isDeleted: false,
        },
      })
      .lean();

    const usersToSendNotification = followerDocs
      .filter((doc) => doc.follower !== null)
      .map((doc) => doc.follower);

    await sendPushNotificationToUsersGroup({
			title: `${user.name}`,
      text: `posted a New Event!`,
      type: NOTIFICATIONS_TYPES.NEW_EVENT,
      users: usersToSendNotification,
      userId: user._id,
      extraData: {
				event
			},
    });

    res.send(event)
    return res.status(200).send({
      valid: true,
      message: 'Event created succesfully, Push notification sent successfully, ',
    });

  } catch (err) {
    console.error(err);

    return res.status(500).send({
      valid: false,
      message: 'Error sending push notification',
    });
  }
  
};

actions.update = ({ body, params }, res) => {
	return Event.findById(params.id)
		.then(async (event) => {
			if (!event) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					event[key] !== body[key]
				) {
					event[key] = null;
					event[key] = body[key];
					event.markModified(key);
				}
			}
			await event.save();

			res.send(event);
		});
};

actions.coverImage = async (req, res) => {
	let event = await Event.findById(req.params.id)

	if (_.isNil(event)) {
		return res.status(404).send();
	}

	if(!req.file){
		res.json({
			success:false,
			message: "You must provide at least 1 file"
		});
	}

	try {
		event.coverImage = await uploadToS3(req.file)
		await event.save();
		res.send(event)
	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
};

actions.destroy = async function ({ params: { id } }, res) {
  const event = await Event.findById(id);

  if (_.isNil(event)) {
    return res.status(404).send();
  }

	const obliteratedEvent = await event.obscureFields();
	res.status(200).send(obliteratedEvent);

};

export { actions };
