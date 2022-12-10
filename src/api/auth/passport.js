import { BasicStrategy } from 'passport-http';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { ADMIN, User } from '../users/model';

import passport from 'passport';
import { JWT_SECRET } from '../../config';

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
	const { required } = params;
	return passport.authenticate('token', { session: false }, (err, user) => {

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
		console.log('password strategy');
		User.findOne({ email: email.toLowerCase() }).then(user => {
			if (!user) {
				done(true);
				return null;
			}
			return user
				.authenticate(password, user.password)
				.then((user) => {
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
			User.findOne({ _id: id })
				.then(user => {

					if (!user) {
						return done(null, undefined);
					}

					return done(null, user);
				})
				.catch(done);
		}
	)
);

export default passport;
