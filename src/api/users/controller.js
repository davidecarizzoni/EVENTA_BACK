import {ADMIN, User} from './model';
import {uploadToS3} from "../../services/upload";

import _ from 'lodash';
import {Follow} from "../follow/model";
import mongoose from "mongoose";

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await User.find(query).skip(cursor.skip).limit(cursor.limit).sort(cursor.sort);
  const totalData = await User.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({user, querymen: { query, cursor } , params: { id }, res}) {

  const userCheck = await User.findById(id).lean();
	const followers = await Follow.countDocuments({ followedId: id })
	const followed = await Follow.countDocuments({ followerId: id })

	const followedId = req.query;


  const result = await Follow.aggregate([
    {
      $match: {
        followerId: mongoose.Types.ObjectId(user._id),
        followedId: mongoose.Types.ObjectId(followedId)
      }
    },
    {
      $group: {
        _id: null,
        count: { $sum: 1 }
      }
    }
  ]);

  const isFollowing = result.length > 0 && result[0].count > 0;

  if (!userCheck) {
    return res.status(404).send();
  }

  res.send({
		...userCheck,
		followers,
		followed,
		isFollowing,
	});

};

actions.follow = async function ({ user, params: { id } }, res) {
	try {
		const follow = await Follow.create({
			followerId: user._id, // segue
			followedId: id, // seguito
		})

		res.send(follow);
	} catch (err) {
		if (err.code === 11000) {
			return res.status(409).send({
			
				valid: false,
				param: 'followerId - followedId',
				message: 'You already follow the user'
			});
		}
		res.status(500).send(err);
	}
};

actions.unfollow = async function ({ user, params: { id } }, res) {
	const follow = await Follow.findOne({
		followerId: user._id, // segue
		followedId: id, // seguito
	})

	console.log('follow', follow)

	if (_.isNil(follow)) {
		return res.status(404).send();
	}

	await follow.delete();
	res.status(204).send();
};

  actions.searchFollower = async function ({params: { id }, querymen: { query, cursor } }, res) {

    const { name } = query;
    const user = await User.findById(id);
    if (!user) {
        return res.status(404).send();
    }
    const followedIds = user.followed.map(follow => follow.toString());

    let filter = { followerId: { $in: followedIds } };
    if (name) {
      filter["$or"] = [
        { "follower.name": { $regex: new RegExp(`.*${name}.*`, "i") } },
        { "follower.username": { $regex: new RegExp(`.*${name}.*`, "i") } }
      ];
    }
  
    const followers = await Follow.aggregate([
     {
       $lookup: {
         from: "users",
         localField: "followerId",
         foreignField: "_id",
         as: "follower"
       }
     },
     {
       $unwind: "$follower"
     },
      {
        $match: filter
      }
    ]);

    if (!followers) {
      return res.status(404).send();
    }
  
    res.send(followers);
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
