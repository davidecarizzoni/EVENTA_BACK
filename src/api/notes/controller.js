import { Note } from './model';
import _ from 'lodash';

const actions = {};
const populationOptions = ['user'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
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
