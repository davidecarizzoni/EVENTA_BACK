require('dotenv/config');

export const JWT_SECRET = process.env.JWT_SECRET;
export const PORT = process.env.PORT || 9000;
export const IP = process.env.IP || '0.0.0.0';
export const MONGODB_URI = process.env.MONGODB_URI;
export const BUCKET_NAME_S3 = process.env.BUCKET_NAME_S3;
export const BUCKET_REGION_S3 = process.env.BUCKET_REGION_S3;
export const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY;
export const AWS_ACCESS_SECRET_KEY = process.env.AWS_ACCESS_SECRET_KEY;


