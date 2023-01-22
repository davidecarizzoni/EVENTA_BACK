import * as AWS from "aws-sdk";
import {BUCKET_NAME_S3, AWS_ACCESS_SECRET_KEY, AWS_ACCESS_KEY, BUCKET_REGION_S3} from "../config";
import crypto from "crypto";
import sharp from 'sharp'
import {GetObjectCommand, S3Client} from "@aws-sdk/client-s3";
import {getSignedUrl} from "@aws-sdk/s3-request-presigner";

const s3GetFile = new S3Client ({
	credentials : {
		accessKeyId: AWS_ACCESS_KEY,
		secretAccessKey: AWS_ACCESS_SECRET_KEY,
	},
	region: BUCKET_REGION_S3
})

const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

export async function uploadToS3(file) {
	console.log('file',file)
	const s3 = new AWS.S3({
		sslEnabled: true,
		accessKeyId:AWS_ACCESS_KEY,
		secretAccessKey: AWS_ACCESS_SECRET_KEY
	});
	// const imagePath = file.buffer
	const fileName = randomImageName()
	// const blob = fs.readFileSync(imagePath)

	const buffer = await sharp(file.buffer).resize({
		height: 500,
		width: 500,
		fit: "contain"
	}).toBuffer()

	const image = await s3.upload({
		Bucket: BUCKET_NAME_S3,
		ACL: 'private',
		contentType: file.mimetype,
		Key: fileName,
		Body: buffer,
	}).promise()


	const getObjectParams = {
		Bucket: BUCKET_NAME_S3,
		Key: image.key,
		Expires:  2419200 * 12
	}
	const command = new GetObjectCommand(getObjectParams);
	const url = await getSignedUrl(s3GetFile, command);

	console.log('image', url)
	return String(url)
}
