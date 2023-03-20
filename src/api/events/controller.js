import {Event} from './model';
import {Participant} from '../participants/model';
import {Like} from '../likes/model';

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

  const userCoordinates = user.position.coordinates;

  const pipeline = [
    {
      $geoNear: {
        near: { type: "Point", coordinates: userCoordinates },
        distanceField: "distance",
        maxDistance: 30000, // in meters
        spherical: true,
        query: query,
        key: "position",
      }
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'eventId',
        as: 'likes',
      },
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
    { $sort: cursor.sort },
    { $sort: { date: 1 } },
    { $skip: cursor.skip },
    { $limit: cursor.limit },
  ];

  const [data, [{ count: totalData }]] = await Promise.all([
    Event.aggregate(pipeline),
    Event.aggregate([{ $match: query }, { $count: 'count' }]),
  ]);

  res.send({ data, totalData });
};


// GET EVENT BY ID + isParticipating
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

// GET & SEARCH PARTICIPANTS OF AN EVENT
actions.participants = async function ({ params: { id }, querymen: { query, cursor } }, res) {
	const { search } = query;
  const data = await Participant.aggregate([
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
			} : { }
		}
    
  ]);

  if (!data) {
    return res.status(404).send();
  }
  const totalData = data.length;
  res.send({ data, totalData });
};

// USER PARCITIPATION TO EVENT
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

// USER UNPARCITIPATION TO EVENT
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

// USER LIKES EVENT
actions.like = async function ({ user, params: { id } }, res) {

	try {
		const like = await Like.create({
			userId: user._id,
			eventId: id,
		})

		res.send(like);
	} catch (err) {
		if (err.code === 11000) {
			return res.status(409)
		}
		res.status(500).send(err);
	}
};

// USER UNLIKES EVENT
actions.unlike = async function ({ user, params: { id } }, res) {
	const like = await Like.findOne({
		userId: user._id,
		eventId: id,
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

actions.near = async function({ params: { id }, query: { coordinates, maxDistance } }, res) {

	if (!maxDistance || isNaN(maxDistance) || maxDistance < 0) {
    return res.status(400).send({ error: 'maxDistance is required and should be a positive number' });
	}

  const events = await Event.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distance',
        spherical: true,
        maxDistance: maxDistance
      }
    },
    { $match: { _id: id } },
    { $limit: 1 },
  ])

  if (!events) {
    return res.status(404).send();
  }

  res.send(events);
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

  await event.delete();

  res.status(204).send();
};

export { actions };
