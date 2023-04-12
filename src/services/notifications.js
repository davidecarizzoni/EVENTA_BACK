import { Expo } from 'expo-server-sdk';
import _ from "lodash";
import {User} from "../api/users/model";
import {Notification, NOTIFICATIONS_TYPES} from "../api/notifications/model";
import Promise from 'bluebird'
import { Types } from 'mongoose';

let expo = new Expo({});

export const sendPushNotification = async ({expoPushToken, userId, title, text, type, extraData = {}}) => {
	if (_.isNil(expoPushToken) || _.isNil(userId)) {
		console.debug('no token')
		return Promise.reject({
			message: 'User expoPushToken not found or userId not provided'
		})
	}
	try {
		const message = {
			to: expoPushToken,
			sound: 'default',
			title,
			body: text,
			data: {
				type,
				...extraData
			}
		}
		return await Promise.all([
			expo.sendPushNotificationsAsync([message]),
			Notification.create({
				targetUserId: Types.ObjectId(userId),
				title: title,
				message: text,
				type: type,
				extraData: { ...extraData },
			})
		])
	} catch (error) {
		console.log(error)
		return Promise.reject(error)
	}
}

//write function to sent push notification to all users
export const sendPushNotificationToAllUsers = async ({ title, text, extraData, type }) => {
	try {
		const users = await User.find({
			expoPushToken: {$ne: null},
			isDeleted: false
			}).select('expoPushToken')
		console.debug(users)
		return await Promise.map(users, async (user) => {
			return await sendPushNotification({
				expoPushToken: user.expoPushToken,
				userId: user._id,
				title,
				text,
				type,
				extraData
			})
		})
	} catch (error) {
		console.log(error)
		return Promise.reject(error)
	}
}

export const sendPushNotificationToUsersGroup = async ({ title, text, extraData, users = [], type}) => {
	try {
		return await Promise.map(users, async (user) => {
			return await sendPushNotification({
				expoPushToken: user.expoPushToken,
				userId: user._id,
				title,
				text,
				type,
				extraData
			})
		})
	} catch (error) {
		console.log(error)
		return Promise.reject(error)
	}
}
