import { Notification } from './model';
import _ from 'lodash';
import {Follow} from "../follow/model";
import { sendPushNotificationToUsersGroup} from "../../services/notifications";
import { NOTIFICATIONS_TYPES} from "./model";
import { User } from '../users/model';

const actions = {};
const populationOptions = ['targetUser', 'user'];


actions.index = async function ({user, querymen: { query, cursor } }, res) {
  const data = await Notification.find({targetUserId: user._id})
	.skip(cursor.skip)
	.limit(cursor.limit)
  .populate(populationOptions)
	.sort({'createdAt':-1})
	.exec();

  const totalData = await Notification.countDocuments({targetUserId: user._id});

  res.send({ data, totalData });
};

actions.showMe = async function ({user, querymen: { query, cursor } }, res) {
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


actions.test = async ({ user, body }, res) => {
  try {

    // Get list of users to send notification to
    const usersToSendNotification = await User.findById(user._id)
    console.log(user.name)

    await sendPushNotificationToUsersGroup({
			title: `${user.name}`,
      text: `posted a New Event!`,
      type: NOTIFICATIONS_TYPES.NEW_EVENT,
      userId: user._id,
      users: [usersToSendNotification],
      extraData: {},
    });
    
    return res.status(200).send({
      valid: true,
      message: 'Push notification sent successfully',
    });
  } catch (err) {
    console.error(err);

    return res.status(500).send({
      valid: false,
      message: 'Error sending push notification',
    });
  }
};



export { actions };
