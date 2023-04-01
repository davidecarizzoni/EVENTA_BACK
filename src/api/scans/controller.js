import { Scan } from './model';

const actions = {};
const populationOptions = ['user', 'event'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Scan.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.populate(populationOptions)
	.exec();

  const totalData = await Scan.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const scan = await Scan
	.findById(id)
	.exec();

  if (!scan) {
    return res.status(404).send();
  }

  res.send(scan);
};

actions.create = async ({ body }, res) => {
  let scan;
  try {
    scan = await Scan.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(scan);
};

actions.update = ({ body, params }, res) => {
	return Scan.findById(params.id)
		.then(async (scan) => {
			if (!scan) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					scan[key] !== body[key]
				) {
					scan[key] = null;
					scan[key] = body[key];
					scan.markModified(key);
				}
			}
			await scan.save();

			res.send(scan);
		});
};
actions.destroy = async function ({ params: { id } }, res) {
  const scan = await Scan.findById(id);

  if (_.isNil(scan)) {
    return res.status(404).send();
  }

  await scan.delete();

  res.status(204).send();
};

export { actions };
