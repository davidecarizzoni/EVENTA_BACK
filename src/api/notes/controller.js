import { Note } from './model';
import {Follow} from "../follow/model";
import {Fire} from "../fires/model";


import _ from 'lodash';

const actions = {};
const populationOptions = ['user'];

actions.index = async function ({ user, querymen: { query, cursor } }, res) {
  try {
    const authenticatedUser = user._id;
    const followDocs = await Follow.find({ followerId: authenticatedUser });
    const followedIds = followDocs.map(doc => doc.followedId);

    const noteQuery = {
      userId: { $in: followedIds },
    };

    // Retrieve the notes with the additional constraint of being created by followed users
    const notes = await Note.find(noteQuery)
      .populate('user')
      .sort('-createdAt')
      .skip(cursor.skip)
      .limit(cursor.limit);

    // Retrieve the authenticated user's notes and concatenate them with the followed users' notes
    const authenticatedUserNotes = await Note.find({ userId: authenticatedUser })
      .populate('user')
      .sort('-createdAt');
    const allNotes = authenticatedUserNotes.concat(notes);

    res.json({ data: allNotes, totalData: allNotes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};


actions.showAll = async function ({ querymen: { query, cursor } }, res) {
  const data = await Note.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
  .populate(populationOptions)
	.exec();

  const totalData = await Note.countDocuments(query);

  res.send({ data, totalData });
};


actions.show = async function ({ params: { id } }, res) {

  const note = await Note
	.findById(id)
	.exec();

  if (!note) {
    return res.status(404).send();
  }

  res.send(note);
};

actions.create = async ({ body }, res) => {
  let note;
  try {
    note = await Note.create(body);
  } catch (err) {
    return null; // to be changed
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
