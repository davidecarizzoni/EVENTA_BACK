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

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/all', token({ required: true }), middleware(), actions.showAll);

router.get('/:id', token({ required: true }), actions.show);


router.post('/:id/fire', token({ required: true }), actions.fire);

router.delete('/:id/unfire', token({ required: true }), actions.unfire);


router.post('/', token({ required: true }), actions.create);

router.delete('/:id', token({ required: true }), actions.destroy);

export default router;

