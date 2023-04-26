import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';
import axios from "axios";
import {USER, User} from "../users/model";
import _ from 'lodash'
import uuid from 'uuid';

const sign = async (id, options) =>  jwt.sign({ id }, JWT_SECRET, options);

export const login = ({ user }, res) => sign(user.id).then((token) => res.send({ token, user }));

export const googleLogin = async ({ body }, res, next)=> {
	const tokenParam = body.token
	console.debug({tokenParam})

	try {
		const { data: userInfo } = await axios({
			method: 'get',
			url: 'https://www.googleapis.com/oauth2/v3/userinfo',
			headers: {
				'Authorization': `Bearer ${tokenParam}`
			}
		});

		console.debug(userInfo)

		if(_.isNil(userInfo.email)) {
			res.status(400).json({
				param: 'no social user exist',
				message: 'no social user exist'
			});
			res.send()
		}

		if(_.isNil(userInfo.email)) {
			res.status(409).json({
				valid: false,
				param: 'email - username',
				message: 'email or username already registered'
			});
			res.send()
		}

		let user = await User.findOne({ email: userInfo.email });
		console.debug('user', user)

		if (_.isNil(user)) {
			user = await User.create({
				email: userInfo.email,
				name: userInfo.given_name || userInfo.name.split(' ')[0] || '',
				username: userInfo.name || '',
				password: 'ahahahhaha',
				role: USER,
				toComplete: true
			})
				.catch(err => {
					console.debug('err', err)
					if (err.name === 'MongoError' && err.code === 11000) {
						res.status(409).json({
							valid: false,
							param: 'email - username',
							message: 'email or username already registered'
						});
						res.send()
					} else {
						next(err);
					}
				});
		}

		const token =  await sign(user._id)
		res.send({ token, user });
	} catch (e) {
		res.status(400).send(e.message);
	}
}

export const appleLogin = async ({ body }, res, next) => {
	try {
		const email = _.get(body, 'email', '')
		const familyName = _.get(body, 'fullName.familyName')
		const givenName = _.get(body, 'fullName.givenName')
		const appleId = _.get(body, 'user')

		if(!email) {
			res.status(400).json({
				param: 'no social user exist',
				message: 'no social user exist'
			});
			res.send()
		}

		let user = await User.findOne({ email: email });
		if (_.isNil(user)) {
			user = await User.create({
				email: email,
				name: familyName,
				username: `${givenName} ${familyName}`,
				password: 'ahahahhaha',
				role: USER,
				appleId: appleId,
				toComplete: true
			})
				.catch(err => {
					console.debug('err', err)
					if (err.name === 'MongoError' && err.code === 11000) {
						res.status(409).json({
							valid: false,
							param: 'email - username',
							message: 'email or username already registered'
						});
						res.send()
					} else {
						next(err);
					}
				});
		}

		const token =  await sign(user._id)
		res.send({ token, user });
	} catch (e) {
		res.status(400).send(e.message);
	}
}

