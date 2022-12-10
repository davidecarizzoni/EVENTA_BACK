import http from 'http';
import api from './api';
import express from './services/express';
import mongoose from './services/mongoose';
import { PORT, IP, MONGODB_URI } from './config';

const app = express(api);
const server = http.createServer(app);

mongoose.connect(
  MONGODB_URI,
  {
      maxIdleTimeMS: 10000,
      keepAlive: false,
  }
);

server.listen(PORT, IP, () => {
	console.debug(`Server listening on IP: ${IP}, PORT: ${PORT}`);
});

export default app;
