import {ADMIN, Event} from './model';
import _ from 'lodash';

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Event.find().skip(cursor.skip).limit(cursor.limit).sort(cursor.sort);
  const totalData = await Event.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const event = await Event.findById(id);

  if (!event) {
    return res.status(404).send();
  }

  res.send(event);
};

actions.showMe = ({ event }, res) => res.send(event);

export { actions };
