import {Event} from './model';
import {Participant} from '../participants/model';

import _ from 'lodash';
import {uploadToS3} from "../../services/upload";
import mongoose from "mongoose";

const actions = {};
const populationOptions = ['organiser', 'participants'];


actions.index = async function({ querymen: { query, select, cursor } }, res) {
  const data = await Event.find(query)
    .skip(cursor.skip)
    .limit(cursor.limit)
    .sort(cursor.sort)
		.select(select)
		.populate(populationOptions)
		.exec();

  const totalData = await Event.countDocuments(query);
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

	console.log('req.file', req.file);

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
