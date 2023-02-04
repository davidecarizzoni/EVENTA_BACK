import {ADMIN, User} from './model';
import {uploadToS3} from "../../services/upload";


import _ from 'lodash';
import {Follow} from "../follow/model";

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await User.find().skip(cursor.skip).limit(cursor.limit).sort(cursor.sort);
  const totalData = await User.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const user = await User.findById(id).lean();
	//se serve solo nel dettaglio facciamo questo
	//se inizia a servire anche nella lista  vediamo quanto diventa pesante e al massimo lo materializziamo nell'utente
	const followers = await Follow.countDocuments({ followedId: id })
	const followed = await Follow.countDocuments({ followerId: id })

  if (!user) {
    return res.status(404).send();
  }

  res.send({
		...user,
		followers,
		followed,
	});

};

actions.follow = async function ({ user, params: { id } }, res) {
	const follow = await Follow.create({
		followerId: user._id, // segue
		followedId: id, // seguito
	})

	console.log('follow', follow)

	res.send(follow);

};

actions.showMe = async ({ user }, res) => {
	const followers = await Follow.countDocuments({ followedId: user.id })
	const followed = await Follow.countDocuments({ followerId: user.id })
	res.send({ ...user._doc, followers, followed });
}

actions.create = async ({ body }, res) => {
  let user;
  try {
    user = await User.create(body)
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).send({
        valid: false,
        param: 'email - username',
        message: 'email or username already registered'
      });
    }
  }

  res.send(user);
};

actions.update = ({ body, params, user }, res, next) => {
	return User.findById(params.id === 'me' ? user.id : params.id)
		.then(result => {
			if (body) {
				delete body.password;
			}

			if (!result) {
				return null;
			}

			const isAdmin = user.role === ADMIN;
			const isSelfUpdate = user.id === result.id;
			if (!isSelfUpdate && !isAdmin) {
				res.status(401).json({
					valid: false,
					message: 'You can\'t change other user\'s data'
				});
				return null;
			}
			return result;
		})
		.then(async (user) => {
			if (!user) {
				return null;
			}

			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					user[key] !== body[key]
				) {
					user[key] = null;
					user[key] = body[key];
					user.markModified(key);
				}
			}
			await user.save();

			res.send(user)
		});
}

actions.profilePic = async ( req, res) => {
	let user = await User.findById(req.params.id)

	if (_.isNil(user)) {
		return res.status(404).send();
	}

	if(!req.file){
		res.status(400).send();
	}

	try {
		user.profilePic = await uploadToS3(req.file)
		await user.save()
		res.send(user)
	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
};


actions.updatePassword = ({ body, params, user }, res, next) => {
	return User.findById(params.id === 'me' ? user.id : params.id)
		.then(result => {
			if (!result) {
				return null;
			}

			const isSelfUpdate = user.id === result.id;
			if (!isSelfUpdate && user.role !== 'admin') {
				res.status(401).json({
					valid: false,
					param: 'password',
					message: 'You can\'t change other user\'s password'
				});
				return null;
			}
			return result;
		})
		.then(user => (user ? user.set({ password: body.password }).save() : null))
		.then(user => res.send(user))
}


actions.destroy = async function ({ params: { id } }, res) {
  const user = await User.findById(id);

  if (_.isNil(user)) {
    return res.status(404).send();
  }

  await user.delete();

  res.status(204).send();
};

export { actions };
