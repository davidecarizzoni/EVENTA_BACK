import { Story } from './model';

import _ from 'lodash';
import { Follow } from '../follow/model';
import { uploadToS3 } from '../../services/upload';

const actions = {};
const populationOptions = ['user'];

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Story.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort({'createdAt':1})
  .populate(populationOptions)
	.exec();

  const totalData = await Story.countDocuments(query);

  res.send({ data, totalData });
};

actions.homeStories = async function({ user, querymen: { query, select, cursor } }, res) {  try {
  const authenticatedUser = user._id;
  const followDocs = await Follow.find({ followerId: authenticatedUser });
  const followedIds = followDocs.map(doc => doc.followedId);

  const noteQuery = {
    userId: { $in: followedIds },
    isRead: false,
  };
  
  const totalData = await Story.countDocuments(noteQuery);
  const data = await Story.find(noteQuery)
    .sort({ createdAt: -1})
    .populate(populationOptions)
    .skip(cursor.skip)
    .limit(cursor.limit)


  res.json({ data, totalData });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

actions.show = async function ({ params: { id } }, res) {

  const story = await Story
	.findById(id)
	.exec();

  if (!story) {
    return res.status(404).send();
  }

  res.send(story);
};

actions.create = async ({ body }, res) => {
  let story;
  try {
    story = await Story.create(body);
  } catch (err) {
    return null; 
  }

  res.send(story);
};

actions.contentImage = async (req, res) => {
	let story = await Story.findById(req.params.id)

	if (_.isNil(story)) {
		return res.status(404).send();
	}

	if(!req.file){
		res.json({
			success:false,
			message: "You must provide at least 1 file"
		});
	}

	try {
		story.contentImage = await uploadToS3(req.file)
		await story.save();
		res.send(story)

	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
};


actions.update = ({ body, params }, res) => {
	return Story.findById(params.id)
		.then(async (story) => {
			if (!story) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					story[key] !== body[key]
				) {
					story[key] = null;
					story[key] = body[key];
					story.markModified(key);
				}
			}
			await story.save();

			res.send(story);
		});
};


actions.destroy = async function ({ params: { id } }, res) {
  const story = await Story.findById(id);

  if (_.isNil(story)) {
    return res.status(404).send();
  }

  await story.delete();

  res.status(204).send();
};

export { actions };
