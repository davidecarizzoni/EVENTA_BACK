import { Discount } from './model';

const actions = {};
const populationOptions = ['user', 'event'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Discount.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.populate(populationOptions)
	.exec();

  const totalData = await Discount.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const discount = await Discount
	.findById(id)
	.exec();

  if (!discount) {
    return res.status(404).send();
  }

  res.send(discount);
};

actions.create = async ({ body }, res) => {
  let discount;
  try {
    discount = await Discount.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(v);
};

actions.update = ({ body, params }, res) => {
	return Discount.findById(params.id)
		.then(async (discount) => {
			if (!discount) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					discount[key] !== body[key]
				) {
					discount[key] = null;
					discount[key] = body[key];
					discount.markModified(key);
				}
			}
			await discount.save();

			res.send(discount);
		});
};
actions.destroy = async function ({ params: { id } }, res) {
  const discount = await Discount.findById(id);

  if (_.isNil(discount)) {
    return res.status(404).send();
  }

  await discount.delete();

  res.status(204).send();
};

export { actions };
