require('dotenv/config');

export const JWT_SECRET = process.env.JWT_SECRET
export const PORT = process.env.LOCAL_PORT || 9000
export const IP = process.env.IP || '0.0.0.0'
export const ENV = process.env.NODE_ENV || 'development'
export const MONGODB_URI = process.env.MONGODB_URI;
export const MONGO = {
  uri: process.env.MONGODB_URI,
  options: {
    debug: true,
  }
}
