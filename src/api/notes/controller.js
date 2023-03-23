import { Note } from './model';
import {Follow} from "../follow/model";
import {Fire} from "../fires/model";

import _ from 'lodash';

const actions = {};
const populationOptions = ['user', "fires"];

// (pagination done + totaldata + sort: check:true)
actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Note.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort({'createdAt':1})
  .populate(populationOptions)
	.exec();

  const totalData = await Note.countDocuments(query);

  res.send({ data, totalData });
};

actions.homeNotes = async function({ user, querymen: { query, select, cursor } }, res) {  
  try {
    const authenticatedUser = user._id;
    const followDocs = await Follow.find({ followerId: authenticatedUser });
    const followedIds = followDocs.map(doc => doc.followedId);

    const dateQuery = {};
    if (query.date) {
      if (query.date.$gte) {
        dateQuery.$gte = new Date(query.date.$gte);
      }
      if (query.date.$lte) {
        dateQuery.$lte = new Date(query.date.$lte);
      }
    }

    const noteQuery = {
      userId: { $in: followedIds },
      createdAt: dateQuery,
    };

    const notes = await Note.find(noteQuery)
      .populate(populationOptions)
      .sort('-createdAt')
      .skip(cursor.skip)
      .limit(cursor.limit)

      const authenticatedUserNotes = await Note.find({
        userId: authenticatedUser,
        createdAt: dateQuery
      })
        .populate(populationOptions)
        .sort('-createdAt')
        .skip(cursor.skip)
        .limit(cursor.limit)
      
    const allNotes = authenticatedUserNotes.concat(notes);

    const notesWithFire = await Promise.all(allNotes.map(async (note) => {
      const fire = await Fire.findOne({ userId: authenticatedUser, noteId: note._id });
      return { ...note.toObject(), hasFired: !!fire };
    }));


    res.json({ data: notesWithFire, totalData: notesWithFire.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

// todo pagination
actions.show = async function ({ params: { id } }, res) {

  const note = await Note
	.findById(id)
	.exec();

  if (!note) {
    return res.status(404).send();
  }

  res.send(note);
};

actions.fire = async function ({ user, params: { id } }, res) {
	try {
		const fire = await Fire.create({
			userId: user._id,
			noteId: id,
		})

		res.send(fire);
	} catch (err) {
		if (err.code === 11000) {
			return res.status(409)
		}
		res.status(500).send(err);
	}
};

actions.unfire = async function ({ user, params: { id } }, res) {
	const fire = await Fire.findOne({
		userId: user._id,
		noteId: id,
	})

	if (_.isNil(fire)) {
		return res.status(404).send();
	}

	await fire.delete();
	res.status(204).send();
};

actions.create = async ({ body }, res) => {
  let note;
  try {
    note = await Note.create(body);
  } catch (err) {
    return null; 
  }

  res.send(note);
};

actions.destroy = async function ({ params: { id } }, res) {
  const note = await Note.findById(id);

  if (_.isNil(note)) {
    return res.status(404).send();
  }

  await note.delete();

  res.status(204).send();
};

export { actions };
