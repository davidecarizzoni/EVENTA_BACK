import {Router} from 'express';
import {token} from '../auth/passport';
import {actions} from './controller';
import {middleware} from 'querymen';
import { Schema } from 'mongoose';
const { upload } = require('../../services/uploadController');

const queryBody = {
  q: {
    type: String, parse: (value, field) => {
      return {
        $or: [
          { name: { $regex: value, $options: 'i' } },
          { description: { $regex: value, $options: 'i' } }
        ]
      };
    }
  },
  organiserId: {
    type: Schema.Types.ObjectId
  },
  date:{
    type: Date
  },
  search:{
    type: String,
  },
  'date.$gte': {
    type: Date,
    paths: ['date'],
    operator: '$gte'
  },
  'date.$lte': {
    type: Date,
    paths: ['date'],
    operator: '$lte'
  },

};


const router = new Router();

// GET EVENTS

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/home', token({ required: true }), middleware(queryBody), actions.homeEvents);

router.get('/mostpopular', token({ required: true }), middleware(queryBody), actions.popular);

router.get('/:id', token({ required: true }), actions.show);

// GET ENTITIES

router.get('/:id/participants', token({ required: true }), middleware(queryBody), actions.showParticipantsForEvent);

router.get('/:id/posts', token({ required: true }), middleware(queryBody), actions.showPostsForEvent);

// ACTIONS

router.post('/:id/participate', token({ required: true }), actions.participate);

router.delete('/:id/unparticipate', token({ required: true }), actions.unparticipate);


router.post('/:id/like', token({ required: true }), actions.like);

router.delete('/:id/unlike', token({ required: true }), actions.unlike);

// EVENT API

router.post('/', token({ required: false }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/coverImage', token({ required: false }), upload.single("file"), actions.coverImage);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

