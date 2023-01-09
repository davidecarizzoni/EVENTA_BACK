import { Event } from './model';
import { PutObjectCommand, S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl, S3RequestPresigner } from "@aws-sdk/s3-request-presigner";

import sharp from 'sharp'
import _ from 'lodash';

const { bucketName, s3, randomImageName } = require('../../services/uploadController');

const actions = {};
const populationOptions = ['organizer'];



actions.index = async function ({ querymen: { query, cursor } }, res) {
  const data = await Event.find()
	.skip(cursor.skip)
	.limit(cursor.limit)
	.sort(cursor.sort)
	.populate(populationOptions)
	.exec();

  for (const event of data){
    
    console.log(event.coverImage)

    const getObjectParams = {
      Bucket: bucketName,
      Key: event.coverImage
    }
    const command = new GetObjectCommand(getObjectParams);
    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    event.imageUrl = url
  }
  
  console.log(data)

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

  const getObjectParams = {
    Bucket: bucketName,
    Key: event.coverImage
  }
  const command = new GetObjectCommand(getObjectParams);
  const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
  event.imageUrl = url

 
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

	let event;
	try {
		if(!req.file){
		res.json({
			success:false,
			message: "You must provide at least 1 file"
		});
		}
		else{
			const buffer = await sharp(req.file.buffer).resize({
				height: 500,
				width: 500, 
				fit: "contain"
			}).toBuffer()
			const imageName = randomImageName()
			const fileInfo = {
				Bucket : bucketName,
				Key: imageName,
				Body: buffer, //req.file.buffer
				ContentType: req.file.mimetype
			}
			const command = new PutObjectCommand(fileInfo)
			await s3.send(command)

			event = await Event.findById(req.params.id)
			event.coverImage = imageName

		}
	}
	catch (err) {
		console.error(err);
		res.status(500).send("Server Error");
	}
	await event.save();
	res.send(event)
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