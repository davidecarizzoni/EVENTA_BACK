import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
const { errorHandler } = require('querymen');
const bodyErrorHandler = require('bodymen').errorHandler;
var passport = require('passport');


export default (routes) => {
	const app = express();
	app.use(cors());
	app.use(compression());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use(routes);
	app.use(errorHandler());
	app.use(bodyErrorHandler());

	return app;
};

