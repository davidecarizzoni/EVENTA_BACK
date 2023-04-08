import { Notification } from './model';
import _ from 'lodash';
import {Follow} from "../follow/model";
import {Post} from "../posts/model";
import {sendPushNotification} from "../../services/notifications";


const actions = {};

actions.index = async function ({user, querymen: { query, cursor } }, res) {
  const data = await Notification.find({userId: user._id})
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.exec();

  const totalData = await Notification.countDocuments({userId: user._id});

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

actions.test = async ({ user }, res) => {
	if (_.isNil(user.expoPushToken)) {
		return res.status(404).send({
			message: 'User expoPushToken not found'
		});
	}
	await sendPushNotification({
		expoPushToken: user.expoPushToken,
		text: 'Test',
		title: 'Ma io che cazzo ne so'
	})
};


export { actions };
