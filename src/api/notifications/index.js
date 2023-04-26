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


router.get('/me', token({ required: true }), middleware(queryBody), actions.index);

router.get('/check', token({ required: true }), middleware(), actions.checkRead);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/setRead', token({ required: true }), middleware(), actions.setRead);

router.post('/test', token({ required: true }), actions.test);


export default router;

