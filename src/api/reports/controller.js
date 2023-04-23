import { Report } from './model';
import _ from 'lodash';

const actions = {};

actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Report.find(query)
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.exec();

  const totalData = await Report.countDocuments(query);

  res.send({ data, totalData });
};


actions.show = async function ({ params: { id } }, res) {

  const report = await Report
	.findById(id)
	.exec();

  if (!report) {
    return res.status(404).send();
  }

  res.send(report);
};

actions.create = async ({ body }, res) => {
  let report;
  try {
    report = await Report.create(body);
  } catch (err) {
    return null; 
  }

  res.send(report);
};

actions.destroy = async function ({ params: { id } }, res) {
  const report = await Report.findById(id);

  if (_.isNil(report)) {
    return res.status(404).send();
  }

  await report.delete();

  res.status(204).send();
};

export { actions };
