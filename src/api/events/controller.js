import {Event} from './model';
import {Partecipant} from '../partecipants/model';
const Promise = require('bluebird');
import _ from 'lodash';
import {getS3SignedUrl, uploadToS3} from "../../services/upload";

const actions = {};
const populationOptions = ['organiser', 'partecipants'];

const addIMageToEntity = async (entity, imagePath) => {
	const imageUrl =  entity[imagePath] ? await getS3SignedUrl(entity[imagePath]) : ''
	return {
		...entity,
		[imagePath]: imageUrl
	}
}

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Event.find()
  	.skip(cursor.skip)
  	.limit(cursor.limit)
  	.sort(cursor.sort)
  	.populate(populationOptions)
		.lean()

	const totalData = await Event.countDocuments(query);
	// data = await Promise.map(data, async (event) => await addIMageToEntity(event, 'coverImage'));

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

actions.locationfilter = async function({ params: { id }, query: { coordinates } }, res) {
  // coordinates is an array in the format [longitude, latitude]

  // Use the $geoNear operator to sort events by proximity to the user's coordinates
  const events = await Event.aggregate([
    {
      $geoNear: {
        near: { type: 'Point', coordinates }, // user's coordinates
        distanceField: 'distance', // add a distance field to the result documents
        spherical: true, // use a spherical model for distance calculations
        maxDistance: 40000
      }
    },
    { $match: { _id: id } },  // filter the events based on the id provided in the request
    { $limit: 1 }, // limit the number of events returned
    { $project: { distance: 0 } } // remove the distance field from the result documents
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

actions.coverImage = async ( req, res) => {
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
