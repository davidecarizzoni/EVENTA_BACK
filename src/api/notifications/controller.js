import { Notification } from './model';
import _ from 'lodash';


const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Notification.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.exec();

  const totalData = await Notification.countDocuments(query);

  res.send({ data, totalData });
};


actions.show = async function ({ params: { id } }, res) {

  const notification = await Notification
	.findById(id)
	.exec();

  if (!notification) {
    return res.status(404).send();
  }

  res.send(notification);
};

actions.create = async ({ body }, res) => {
  let notification;
  try {
    notification = await Notification.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(notification);
};


actions.update = ({ body, params }, res) => {
	return Notification.findById(params.id)
		.then(async (notification) => {
			if (!notification) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					notification[key] !== body[key]
				) {
					notification[key] = null;
					notification[key] = body[key];
					notification.markModified(key);
				}
			}
			await notification.save();

			res.send(notification);
		});
};


export { actions };
