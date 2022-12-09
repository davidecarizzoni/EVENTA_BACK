import bodyParser from 'body-parser';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
const { errorHandler } = require('querymen');
const bodyErrorHandler = require('bodymen').errorHandler;

export default (routes) => {
	const app = express();

	app.use(cors());
	app.use(compression());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(bodyParser.json());
	app.use((req, res, next) => {
		res.setHeader('Access-Control-Expose-Headers', 'entity-count');
		next();
	});
	app.use(routes);
	app.use(errorHandler());
	app.use(bodyErrorHandler());

	return app;
};
