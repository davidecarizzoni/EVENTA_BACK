import { Event } from './model';
import { PutObjectCommand,GetObjectCommand } from "@aws-sdk/client-s3";
import UploadStream from 's3-stream-upload';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import sharp from 'sharp'
import _ from 'lodash';
import {uploadToS3} from "../../services/upload";

const { bucketName, s3, randomImageName, createImageUpload } = require('../../services/uploadController');

const actions = {};
const populationOptions = ['organizer'];


actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Event.find()
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.populate(populationOptions)
	.exec();

  const totalData = await Event.countDocuments(query);

  res.send({ data, totalData });
};

actions.show = async function ({ params: { id } }, res) {

  const event = await Event
	.findById(id)
	.populate(populationOptions)
	.exec();

  if (!event) {
    return res.status(404).send();
  }

  res.send(event);
};


actions.create = async ({ body }, res) => {
	let event;
	try {
		event = await Event.create(body);
	} catch (err) {
		return res.status(409).send({
			valid: false,
			param: 'name',
			message: 'name already registered'
		})
 	}

	res.send(event);
};

actions.update = ({ body, params }, res) => {
	return Event.findById(params.id)
		.then(async (event) => {
			if (!event) {
				return null;
			}
			for (const key in body) {
				if (
					!_.isUndefined(body[key]) &&
					event[key] !== body[key]
				) {
					event[key] = null;
					event[key] = body[key];
					event.markModified(key);
				}
			}
			await event.save();

			res.send(event);
		});
};

actions.coverImage = async ( req, res) => {
	let event = await Event.findById(req.params.id)

	if (_.isNil(event)) {
		return res.status(404).send();
	}

	if(!req.file){
		res.json({
			success:false,
			message: "You must provide at least 1 file"
		});
	}

	try {
		const image = await uploadToS3(req.file)
		const getObjectParams = {
			Bucket: bucketName,
			Key: image.key
		}
		const command = new GetObjectCommand(getObjectParams);
		const url = await getSignedUrl(s3, command);
		console.log('image', url)
		event.coverImage = url
		await event.save();
		res.send(event)
	} catch (err) {
		console.error(err);
		res.status(500).send(err);
	}
};


actions.destroy = async function ({ params: { id } }, res) {
  const event = await Event.findById(id);

  if (_.isNil(event)) {
    return res.status(404).send();
  }

  await event.delete();

  res.status(204).send();
};

export { actions };
