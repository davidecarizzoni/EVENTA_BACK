import * as AWS from "aws-sdk";
import {BUCKET_NAME_S3, AWS_ACCESS_SECRET_KEY, AWS_ACCESS_KEY, BUCKET_REGION_S3} from "../config";
import crypto from "crypto";
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";
const fs = require("fs");

const s3GetFile = new S3Client ({
	credentials : {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_ACCESS_SECRET_KEY,
	},
	region: BUCKET_REGION_S3
})

export async function getS3SignedUrl (key) {
	const getObjectParams = {
		Bucket: BUCKET_NAME_S3,
		Key: key,
		// Expires: 60 * 60 * 24
	}
	const command = new GetObjectCommand(getObjectParams);
	const url = await getSignedUrl(s3GetFile, command);

	console.log('image', url)
	return String(url)
}

export async function uploadToS3(file) {
	const s3 = new AWS.S3({
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_ACCESS_SECRET_KEY
	});
	const fileStream = fs.createReadStream(file.path);

	const uploadParams = {
		Bucket: BUCKET_NAME_S3,

		Body: fileStream,
		Key: file.filename,
		ACL: 'public-read',
	};

	const img = await s3.upload(uploadParams).promise();
	fs.unlink(file.path, function (err) {
		if (err) {
			console.error(err);
		}
	});
	console.log('img', img)
	return img.Location || ''
}


