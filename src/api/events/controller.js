import {Event} from './model';
import {Partecipant} from '../partecipants/model';

import _ from 'lodash';
import {uploadToS3} from "../../services/upload";

const actions = {};
const populationOptions = ['organiser', 'partecipants'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Event.find()
  .skip(cursor.skip)
  .limit(cursor.limit)
  .sort(cursor.sort)
  .populate(populationOptions)
  .exec();

  const totalData = await Event.countDocuments(query);

  res.send({ data, totalData });
};

actions.participants = async function ({ params, querymen: { query, cursor } }, res) {
	const data = await Partecipant.find({ ...query, eventId: params.id})
		.skip(cursor.skip)
		.limit(cursor.limit)
		.sort(cursor.sort)
		.populate(['user'])
		.exec();

	const totalData = await Partecipant.countDocuments(query);

	res.send({ data, totalData });
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


actions.show = async function ({ params: { id } }, res) {

  const event = await Event
	.findById(id)
	.populate(populationOptions)
	.exec();

  if (!event) {
    return res.status(404).send();
  }

  res.send(event);
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
