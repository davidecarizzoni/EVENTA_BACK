import http from 'http';
import api from './api';
import express from './services/express';
import mongoose from './services/mongoose';
import {PORT, IP, ENV, MONGODB_URI} from "./config";

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
        console.log(
          `Express server listening on http://${IP}:${PORT}, in ${ENV} mode`
        );
    })

export default app;
