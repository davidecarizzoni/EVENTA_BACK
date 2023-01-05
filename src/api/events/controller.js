import { Event } from './model';
import _ from 'lodash';
const upload = require('../../services/uploadController');
const fs = require('fs')

const actions = {};
const populationOptions = ['organizer'];

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
    return null; // to be changed
  }

  res.send(event);
};


// actions.postImage = (req, res) => {
// 	return Event.findById(req.params.id)
// 		.then(async (event) => {
// 			if (!event) {
// 				return null;
// 			}
//       for (const key in body) {
// 				if (
// 					!_.isUndefined(body[key]) &&
// 					event[key] !== body[key]
// 				) {
// 					event[key] = fs.readFileSync("/Users/federico/Desktop/EVENTA_BACK/src/uploads" + body[key].file.filename);
// 					event.markModified(key);
// 				}
// 			}

// 			res.send(event);
// 		});
// };

actions.postImage = async (req, res) => {
	
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      eventImage : fs.readFileSync("/Users/federico/Desktop/EVENTA_BACK/src/uploads/" + req.file.filename),
    },
    {new: true})

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




actions.destroy = async function ({ params: { id } }, res) {
  const event = await Event.findById(id);

  if (_.isNil(event)) {
    return res.status(404).send();
  }

  await event.delete();

  res.status(204).send();
};

export { actions };
