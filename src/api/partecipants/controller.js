import { Partecipant } from './model';
import _ from 'lodash';

const actions = {};
const populationOptions1 = ['userId'];
const populationOptions2 = ['event'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Partecipant.find()
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.populate('event')
	.populate('user')
	.exec();

  const totalData = await Partecipant.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const partecipant = await Partecipant
	.findById(id)
	.exec();

  if (!partecipant) {
    return res.status(404).send();
  }

  res.send(partecipant);
};


actions.create = async ({ body }, res) => {
  let partecipant;
  try {
    partecipant = await Partecipant.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(partecipant);
};


actions.update = ({ body, params }, res) => {
	return Partecipant.findById(params.id)
		.then(async (partecipant) => {
			if (!partecipant) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					partecipant[key] !== body[key]
				) {
					partecipant[key] = null;
					partecipant[key] = body[key];
					partecipant.markModified(key);
				}
			}
			await partecipant.save();

			res.send(partecipant);
		});
};


actions.destroy = async function ({ params: { id } }, res) {
  const partecipant = await Partecipant.findById(id);

  if (_.isNil(partecipant)) {
    return res.status(404).send();
  }

  await partecipant.delete();

  res.status(204).send();
};

export { actions };
