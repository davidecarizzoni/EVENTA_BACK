import {Event} from './model';
import {Participant} from '../participants/model';
import {Like} from '../likes/model';
import {Post} from '../posts/model';

import mongoose from "mongoose";
import {Types} from "mongoose";

import _ from 'lodash';
import {uploadToS3} from "../../services/upload";

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

  const pipeline = [
    {
      $match: query,
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
      $sort: {
        date: 1,
        name: 1
      }
    },
    { $skip: cursor.skip },
    { $limit: cursor.limit },
  ];
  const [data, count] = await Promise.all([
    Event.aggregate(pipeline),
    Event.aggregate([{ $match: query }, { $count: 'count' }]),
  ]);
  
  const totalData = count.length ? count[0].count : 0;
  res.send({ data, totalData });
};

actions.homeEvents = async function({ user, querymen: { query, select, cursor } }, res) {
  const userCoordinates = user.position.coordinates;
  const geoNearStage = {
    $geoNear: {
      near: { type: "Point", coordinates: userCoordinates },
      distanceField: "distance",
      maxDistance: 150000, // in meters
      spherical: true,
      query: query,
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
      $sort: {
        date: 1,
        name: 1
      }
    },
    { $skip: cursor.skip },
    { $limit: cursor.limit },
  ];

  const countPipeline = [geoNearStage, { $count: 'count' }];
  const [data, count] = await Promise.all([
    Event.aggregate(pipeline),
    Event.aggregate(countPipeline),
  ]);

  const totalData = count.length ? count[0].count : 0;
  res.send({ data, totalData });
};


actions.show = async function ({ user, params: { id } }, res) {

  const event = await Event
    .findById(id)
    .populate(populationOptions)
    .exec();

  if (!event) {
    return res.status(404).send();
  }

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
      }
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
      ...event.toObject(),
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
  const pipeline = [
    {
      $match: {
        eventId: Types.ObjectId(id)
      }
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
      $match: search ? {
        $or: [
          { "user.name": { $regex: new RegExp(`.*${search}.*`, "i") } },
          { "user.username": { $regex: new RegExp(`.*${search}.*`, "i") } }
        ]
      } : {}
    },
    { $sort: { "user.name": 1 } },
    { $skip: cursor.skip },
    { $limit: cursor.limit }
  ];

  const [data, count] = await Promise.all([
    Participant.aggregate(pipeline),
    Participant.aggregate([
      { $match: { eventId: Types.ObjectId(id) } },
      { $count: "count" }
    ])
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

actions.create = async ({ body }, res) => {
  let participant;
  try {
    participant = await Participant.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(participant);
};

actions.create = async ({ body }, res) => {
	let event;
	try {
		event = await Event.create(body);
	} catch (err) {
		return res.status(409).send({
			valid: false,
			param: 'name',
			message: 'name already registered'
		})
 	}

	res.send(event);
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
	res.status(200).send(obliteratedEvent);};

export { actions };
