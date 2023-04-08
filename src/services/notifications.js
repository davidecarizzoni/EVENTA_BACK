import { Expo } from 'expo-server-sdk';
import _ from "lodash";
import {User} from "../api/users/model";
import Promise from 'bluebird'

let expo = new Expo({});

export const sendPushNotification = async ({expoPushToken, title, text, extraData = {}}) => {
	if (_.isNil(expoPushToken)) {
		console.debug('no token')
		return Promise.reject({
			message: 'User expoPushToken not found'
		})
	}
	try {
		const message = {
			to: expoPushToken,
			sound: 'default',
			title,
			body: text,
			data: {
				...extraData
			}
		}
		return await expo.sendPushNotificationsAsync([message])
	} catch (error) {
		console.log(error)
		return Promise.reject(error)
	}
}


//write function to sent push notification to all users
export const sendPushNotificationToAllUsers = async ({ title, text, extraData }) => {
	try {
		const users = await User.find({
			expoPushToken: {$ne: null},
			isDeleted: false
			}).select('expoPushToken')
		console.debug(users)
		return await Promise.map(users, async (user) => {
			return await sendPushNotification({
				expoPushToken: user.expoPushToken,
				title,
				text,
				extraData
			})
		})
	} catch (error) {
		console.log(error)
		return Promise.reject(error)
	}
}

export const sendPushNotificationToUsersGroup = async ({ title, text, extraData, users = []}) => {
	try {
		return await Promise.map(users, async (user) => {
			return await sendPushNotification({
				expoPushToken: user.expoPushToken,
				title,
				text,
				extraData
			})
		})
	} catch (error) {
		console.log(error)
		return Promise.reject(error)
	}
}
