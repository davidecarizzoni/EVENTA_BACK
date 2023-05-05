import { Block } from './model';
import _ from 'lodash';

const actions = {};
const populationOptions = ['blocker', 'blocked'];

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Block.find(query)
    .skip(cursor.skip)
    .limit(cursor.limit)
    .populate(populationOptions)
    .sort(cursor.sort)
    .exec();
    
  const totalData = await Block.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const block = await Block
    .findById(id)
    .exec();

  if (!block) {
    return res.status(404).send();
  }

  res.send(block);
};

actions.create = async ({ user, body }, res) => {
  let block;
  try {
    block = await Block.create(body);
  } catch (err) {
    return null; // to be changed
  }

  res.send(block);
};

actions.update = ({ body, params }, res) => {
    return Block.findById(params.id)
        .then(async (block) => {
            if (!block) {
                return null;
            }
            for (const key in body) {
                if (
                    !_.isUndefined(body[key]) &&
                    block[key] !== body[key]
                ) {
                  block[key] = null;
                  block[key] = body[key];
                  block.markModified(key);
                }
            }
            await block.save();

            res.send(block);
        });
  };

actions.destroy = async function ({ user, params: { userId }, res }) {

  const block = await Block.findOne({
    blockerId: mongoose.Types.ObjectId(user._id),
    blockedId: mongoose.Types.ObjectId(userId)
  });

  if (_.isNil(block)) {
    return res.status(404).send();
  }

  await block.delete();
  res.status(204).send();
};

export { actions };
