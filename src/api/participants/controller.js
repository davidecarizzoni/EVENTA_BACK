import { Participant } from './model';
import _ from 'lodash';

const actions = {};
const populationOptions = ['user'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Participant.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.exec();

  const totalData = await Participant.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const participant = await Participant
	.findById(id)
	.exec();

  if (!participant) {
    return res.status(404).send();
  }

  res.send(participant);
};

actions.create = async ({ body }, res) => {
  let participant;
  try {
    participant = await Participant.create(body);
  } catch (err) {
    return null; 
  }

  res.send(participant);
};

actions.update = ({ body, params }, res) => {
	return Participant.findById(params.id)
		.then(async (participant) => {
			if (!participant) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					participant[key] !== body[key]
				) {
					participant[key] = null;
					participant[key] = body[key];
					participant.markModified(key);
				}
			}
			await participant.save();

			res.send(participant);
		});
};

actions.destroy = async function ({ params: { id } }, res) {
  const participant = await Participant.findById(id);

  if (_.isNil(participant)) {
    return res.status(404).send();
  }

  await participant.delete();

  res.status(204).send();
};

export { actions };
