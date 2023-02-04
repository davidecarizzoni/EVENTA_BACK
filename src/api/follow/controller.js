import { Follow } from './model';
import _ from 'lodash';

const actions = {};
actions.index = async function ({ querymen: { query, cursor } }, res) {
    const data = await Follow.find()
      .skip(cursor.skip)
      .limit(cursor.limit)
      .sort(cursor.sort)
      .exec();

    const totalData = await Follow.countDocuments(query);

    res.send({ data, totalData });
  };

  actions.show = async function ({ params: { id } }, res) {

    const follow = await Follow
      .findById(id)
      .exec();

    if (!follow) {
      return res.status(404).send();
    }

    res.send(follow);
  };


  actions.create = async ({ body }, res) => {
    let follow;
    try {
        follow = await Follow.create(body);
    } catch (err) {
      return null; // to be changed
    }

    res.send(follow);
  };


  actions.update = ({ body, params }, res) => {
      return Follow.findById(params.id)
          .then(async (follow) => {
              if (!follow) {
                  return null;
              }
              for (const key in body) {
                  if (
                      !_.isUndefined(body[key]) &&
                      follow[key] !== body[key]
                  ) {
                    follow[key] = null;
                    follow[key] = body[key];
                    follow.markModified(key);
                  }
              }
              await follow.save();

              res.send(follow);
          });
  };


  actions.destroy = async function ({ params: { id } }, res) {
    const follow = await Follow.findById(id);

    if (_.isNil(follow)) {
      return res.status(404).send();
    }

    await follow.delete();

    res.status(204).send();
  };

  export { actions };
