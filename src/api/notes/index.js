import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';

const router = new Router();

const queryBody = {
  date: {
    type: Date,
    paths: ['date'],
    operator: '$eq'
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
  }
};

// GET NOTES

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/userNotes', token({ required: true }), middleware(queryBody), actions.userNotes);

router.get('/followedNotes', token({ required: true }), middleware(queryBody), actions.followedNotes);

router.get('/:id', token({ required: true }), actions.show);

// ACTIONS

router.post('/:id/fire', token({ required: true }), actions.fire);

router.delete('/:id/unfire', token({ required: true }), actions.unfire);

// NOTE API

router.post('/', token({ required: true }), actions.create);

router.delete('/:id', token({ required: true }), actions.destroy);

export default router;

