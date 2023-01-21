import { S3Client } from "@aws-sdk/client-s3";
import { BUCKET_NAME_S3, BUCKET_REGION_S3, AWS_ACCESS_KEY, AWS_ACCESS_SECRET_KEY,  } from '../config';
import crypto from 'crypto'
import UploadStream from 's3-stream-upload'
const multer = require("multer");
import sharp from 'sharp'

const s3 = new S3Client ({
    credentials : {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_ACCESS_SECRET_KEY,
				ACL: 'public-read',
    },
    region: BUCKET_REGION_S3
})



const bucketName = BUCKET_NAME_S3
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
const storage = multer.memoryStorage()

const createImageUpload = async (file) => {
	const imageName = randomImageName()

	const fileBuffer = await sharp(file).resize({
		height: 500,
		width: 500,
		fit: "contain"
	}).toBuffer()

	const s3UploadOptions = {
		Bucket : BUCKET_NAME_S3,
		Key: imageName,
		// ACL: 'public-read',
		Body: fileBuffer,
		ContentType: 'image/png',
	}

	// let baseUrl = 'https://s3-eu-central-1.amazonaws.com/' + bucketName + '/';
	// const filePath = baseUrl + imageName;
	// console.log(filePath, file, imageName);
	const res = await UploadStream(s3, s3UploadOptions)
	console.log(res, 'res')
	return res
}

const upload = multer({
    storage: storage,
})


module.exports = { upload, bucketName, s3, randomImageName, createImageUpload};
