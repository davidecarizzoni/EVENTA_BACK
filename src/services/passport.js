import { BasicStrategy } from 'passport-http';
import { Strategy as BearerStrategy } from 'passport-http-bearer';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import {ADMIN, User} from '../api/users/model';

import passport from 'passport';
import { JWT_SECRET } from "../config";

export const password = () => (req, res, next) => passport.authenticate('password', { session: false }, (err, user) => {
	if (err && err.param) {
		return res.status(400).json(err);
	} else if (err || !user) {
		return res.status(401).end();
	}
	req.logIn(user, { session: false }, (err) => {
		if (err) {
			return res.status(401).end();
		}

		next();
	});
})(req, res, next);

export const token = (params) => (req, res, next) => {
	const { required, master, roles } = params;
	return passport.authenticate('token', { session: false }, (err, user) => {

		if (master && (err || (required && !user))) {
			return passport.authenticate('master', { session: false }, (err, result) => {
				if (result !== false) {
					return next();
				}
				return res.status(401).end();
			})(req, res, next);
		}

		if (err || (required && !user)) {
			return res.status(401).end();
		}


		req.logIn(user, { session: false }, (err) => {
			if (err) {
				return res.status(401).end();
			}
			next();
		});
	})(req, res, next);
};

export const admin = token({
	required: true,
	master: false,
	roles: [ADMIN]
});

passport.use(
	'password',
	new BasicStrategy((email, password, done) => {

		User.findOne({ email: email.toLowerCase() }).then(user => {
			console.log(user)
			if (!user) {
				done(true);
				return null;
			}
			return user
				.authenticate(password, user.password)
				.then((user) => {
					user.pre_last_login = user.last_login;
					user.last_login = new Date();

					user.save();
					done(null, user);
					return null;
				})
				.catch(done);
		});
	})
);

passport.use(
	'token',
	new JwtStrategy(
		{
			secretOrKey: JWT_SECRET,
			jwtFromRequest: ExtractJwt.fromExtractors([
				ExtractJwt.fromUrlQueryParameter('access_token'),
				ExtractJwt.fromBodyField('access_token'),
				ExtractJwt.fromAuthHeaderWithScheme('Bearer')
			])
		},
		({ id }, done) => {
			User.findOne({ _id: id, isEnabled: true })
				.then(user => {

					if (!user) {
						return done(null, undefined)
					}

					return done(null, user);
				})
				.catch(done);
		}
	)
);

export default passport;
