import { Expo } from 'expo-server-sdk';

let expo = new Expo();

export const sendPushNotification = async ({expoPushToken, title, text, extraData = {}}) => {
	try {
		const message = {
			to: expoPushToken,
			sound: 'default',
			title,
			body: text,
			data: { withSome: 'data' }
		}

		await expo.sendPushNotificationsAsync([message]);
	} catch (error) {
		console.log(error)
		return Promise.reject(error)
	}
}
