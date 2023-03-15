import { Note } from './model';
import {Follow} from "../follow/model";

import _ from 'lodash';

const actions = {};
actions.index = async function ({ user, querymen: { query, cursor } }, res) {
  try {
    const authenticatedUser = user._id;
    const followDocs = await Follow.find({ followerId: authenticatedUser });
    const followedIds = followDocs.map(doc => doc.followedId);

    const noteQuery = {
      userId: { $in: followedIds },
    };
    
    const notes = await Note.find(noteQuery)
      .populate('user')
      .sort('-createdAt')
      .skip(cursor.skip)
      .limit(cursor.limit);

    res.json({ data: notes, totalData: notes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
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
  console.log(body)
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
