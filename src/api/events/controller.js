import {ADMIN, Event} from './model';
import _ from 'lodash';

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Event.find().skip(cursor.skip).limit(cursor.limit).sort(cursor.sort).populate("organizer");
  const totalData = await Event.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const event = await Event.findById(id).populate("organizer");

  if (!event) {
    return res.status(404).send();
  }

  res.send(event);
};

actions.showMe = ({ event }, res) => res.send(event);

actions.create = async ({ body }, res) => {
  let event;
  try {
    event = await Event.create(body)
  } catch (err) {
    return null // to be changed
  }

  res.send(event);
};


actions.update = ({ body, params, event }, res, next) => {

	return Event.findById(params.id)
  
		.then(async (event) => {
			if (!event) {
				return null;
			}
      console.log(body)
      console.log(params)
      console.log(event)
    

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

			res.send(event)
		});
}


actions.destroy = async function ({ params: { id } }, res) {
  const event = await Event.findById(id);

  if (_.isNil(event)) {
    return res.status(404).send();
  }

  await event.delete();

  res.status(204).send();
};

export { actions };
