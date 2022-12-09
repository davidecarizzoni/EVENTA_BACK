//IMPORTS
const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');


require('./src/api/auth')
mongoose.Promise = global.Promise;

mongoose.set('strictQuery', false)


//  ROUTERS
const userRouter = require('./src/api/users');
const eventRouter = require('./src/api/events');
const authRoutes = require('./src/api/auth/controller');

//  START EXPRESS APP
const app = express();


//  MIDDLEWARE
app.use(bodyParser.json());
app.use(morgan('tiny'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());
app.options('*', cors()); 

//  SET ROUTES WITH AUTHENTICATION
app.use('/users', passport.authenticate('jwt', { session: false }), userRouter)
app.use('/events', passport.authenticate('jwt', { session: false }), eventRouter)
app.use(`/auth`, authRoutes);


//  ENVIROMENT VARIABLES
require('dotenv/config');
const localPort = process.env.LOCAL_PORT;
const CONNECTION_URL = process.env.CONNECTION_STRING;




//  CONNECTION TO DATABASE
mongoose.connect(CONNECTION_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Database Connection is ready...')
})
.catch((err) => {
    console.log(err)
})

//  SERVER CONNECTION
app.listen(3000, () => {
    console.log(`Server is running http://localhost:${localPort}`);
})