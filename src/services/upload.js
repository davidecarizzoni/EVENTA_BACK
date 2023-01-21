import * as AWS from "aws-sdk";
import {BUCKET_NAME_S3, AWS_ACCESS_SECRET_KEY, AWS_ACCESS_KEY} from "../config";
import crypto from "crypto";
import sharp from 'sharp'


const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

export async function uploadToS3(file) {
	const s3 = new AWS.S3({
		sslEnabled: true,
		accessKeyId:AWS_ACCESS_KEY,
		secretAccessKey: AWS_ACCESS_SECRET_KEY
	});
	console.log('file',file)
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
	console.log('image', image)
	return image
}
