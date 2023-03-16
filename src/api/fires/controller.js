import { Fire } from './model';
import _ from 'lodash';

const actions = {};
const populationOptions = ['user', "note"];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Fire.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
  .populate(populationOptions)
	.exec();

  const totalData = await Fire.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const fire = await Fire
	.findById(id)
	.exec();

  if (!fire) {
    return res.status(404).send();
  }

  res.send(fire);
};

actions.create = async ({ body }, res) => {
  let fire;
  try {
    fire = await Fire.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(fire);
};

actions.destroy = async function ({ params: { id } }, res) {
  const fire = await Fire.findById(id);

  if (_.isNil(fire)) {
    return res.status(404).send();
  }

  await fire.delete();

  res.status(204).send();
};

export { actions };
