import { Comment } from './model';
import _ from 'lodash';

const actions = {};
const populationOptions = ['post', 'user'];

actions.index = async function ({ querymen: { query, cursor } }, res) {
    const data = await Comment.find(query)
      .skip(cursor.skip)
      .limit(cursor.limit)
      .populate(populationOptions)
      .sort(cursor.sort)
      .exec();
    const totalData = await Comment.countDocuments(query);

    res.send({ data, totalData });
  };

  actions.show = async function ({ params: { id } }, res) {

    const comment = await Comment
      .findById(id)
      .exec();

    if (!comment) {
      return res.status(404).send();
    }

    res.send(comment);
  };

  actions.create = async ({ body }, res) => {
    let comment;
    try {
      comment = await Comment.create(body);
      
    } catch (err) {
      return null; // to be changed
    }

    res.send(comment);
  };

  actions.update = ({ body, params }, res) => {
      return Comment.findById(params.id)
          .then(async (comment) => {
              if (!comment) {
                  return null;
              }
              for (const key in body) {
                  if (
                      !_.isUndefined(body[key]) &&
                      comment[key] !== body[key]
                  ) {
                    comment[key] = null;
                    comment[key] = body[key];
                    comment.markModified(key);
                  }
              }
              await comment.save();

              res.send(comment);
          });
  };

  actions.destroy = async function ({ params: { id } }, res) {
    const comment = await Comment.findById(id);

    if (_.isNil(comment)) {
      return res.status(404).send();
    }

    await comment.delete();

    res.status(204).send();
  };

  export { actions };
