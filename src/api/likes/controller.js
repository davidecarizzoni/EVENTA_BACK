import { Like } from './model';
import _ from 'lodash';

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Like.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
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

actions.update = ({ body, params }, res) => {
	return Like.findById(params.id)
		.then(async (like) => {
			if (!like) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					like[key] !== body[key]
				) {
					like[key] = null;
					like[key] = body[key];
					like.markModified(key);
				}
			}
			await like.save();

			res.send(like);
		});
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
