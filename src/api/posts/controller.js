import { Post } from './model';

import _ from 'lodash';
import {uploadToS3} from "../../services/upload";


const actions = {};
const populationOptions = ['user', 'event'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Post.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.populate(populationOptions)
	.exec();

  const totalData = await Post.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const post = await Post
	.findById(id)
	.exec();

  if (!post) {
    return res.status(404).send();
  }

  res.send(post);
};

actions.create = async ({ body }, res) => {
  let post;
  try {
    post = await Post.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(post);
};

actions.update = ({ body, params }, res) => {
	return Post.findById(params.id)
		.then(async (post) => {
			if (!post) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					post[key] !== body[key]
				) {
					post[key] = null;
					post[key] = body[key];
					post.markModified(key);
				}
			}
			await post.save();

			res.send(post);
		});
};


actions.postImage = async ( req, res) => {
	let post = await Post.findById(req.params.id)

	if (_.isNil(post)) {
		return res.status(404).send();
	}

	if(!req.file){
		res.status(400).send();
	}

	try {
		post.postImage = await uploadToS3(req.file)
		await post.save()
		res.send(post)
	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
};
actions.destroy = async function ({ params: { id } }, res) {
  const post = await Post.findById(id);

  if (_.isNil(post)) {
    return res.status(404).send();
  }

  await post.delete();

  res.status(204).send();
};

export { actions };
