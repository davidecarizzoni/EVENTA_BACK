import { S3Client } from "@aws-sdk/client-s3";
import { BUCKET_NAME_S3, BUCKET_REGION_S3, AWS_ACCESS_KEY, AWS_ACCESS_SECRET_KEY,  } from '../config';
import crypto from 'crypto'

const multer = require("multer");
var path = require('path');

const s3 = new S3Client ({
    credentials : {
        accessKeyId: AWS_ACCESS_KEY,
        secretAccessKey: AWS_ACCESS_SECRET_KEY,
    },
    region: BUCKET_REGION_S3

})



const bucketName = BUCKET_NAME_S3
const randomImageName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')
const storage = multer.memoryStorage()

const upload = multer({
    storage: storage,
})


module.exports = { upload, bucketName, s3, randomImageName};
