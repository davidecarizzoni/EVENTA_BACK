import { Like } from './model';
import _ from 'lodash';


const actions = {};
const populationOptions = ['user'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Like.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
  .populate(populationOptions)
	.exec();

  const totalData = await Like.countDocuments(query);

  res.send({ data, totalData });
};


actions.show = async function ({ params: { id } }, res) {

  const like = await Like
	.findById(id)
	.exec();

  if (!like) {
    return res.status(404).send();
  }

  res.send(like);
};

actions.create = async ({ body }, res) => {
  let like;
  try {
    like = await Like.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(like);
};

actions.destroy = async function ({ params: { id } }, res) {
  const like = await Like.findById(id);

  if (_.isNil(like)) {
    return res.status(404).send();
  }

  await like.delete();

  res.status(204).send();
};

export { actions };
