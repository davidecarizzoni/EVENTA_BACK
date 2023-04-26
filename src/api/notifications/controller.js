import _ from 'lodash';
import { User } from '../users/model';
import { Notification } from './model';

import { sendPushNotificationToUsersGroup} from "../../services/notifications";
import { NOTIFICATIONS_TYPES} from "./model";

const actions = {};
const populationOptions = ['targetUser', 'senderUser'];


actions.index = async function ({user, querymen: { query, cursor } }, res) {

  const dateQuery = {};
  if (query.date) {
    if (query.date.$gte) {
      dateQuery.$gte = new Date(query.date.$gte);
    }
    if (query.date.$lte) {
      dateQuery.$lte = new Date(query.date.$lte);
    }
  }

  const noteQuery = {
    targetUserId: user._id,
    createdAt: dateQuery
  };

  const data = await Notification.find(noteQuery)
	.skip(cursor.skip)
	.limit(cursor.limit)
  .populate(populationOptions)
	.sort({'createdAt':-1})
	.exec();

  const totalData = await Notification.countDocuments(noteQuery);

  res.send({ data, totalData });
};


actions.checkRead = async function ({user, querymen: { query, cursor } }, res) {
  const totalData = await Notification.countDocuments({targetUserId: user._id, isRead: false});

  res.send({ totalData });
};


actions.setRead = async function ({user, querymen: { query, cursor } }, res) {
      await Notification.updateMany({targetUserId: user._id, isRead: false}, {isRead: true});
  
    res.send({ success: true });
  
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
    return null; 
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
    const usersToSendNotification = await User.findById(user._id)

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
