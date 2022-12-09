/* eslint-disable no-console */
import mongoose from 'mongoose';

const Promise = require('bluebird');

mongoose.Promise = Promise;
mongoose.set('debug', true);
mongoose.set('strictQuery', false);
mongoose.connection.on('error', err => {
	console.error('MongoDB connection error: ' + err);
	process.exit(-1);
});
mongoose.connection.on('connected', () => {
	console.info('MongoDB connected');
});


export default mongoose;
