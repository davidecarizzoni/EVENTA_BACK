import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';

const router = new Router();


router.get('/me', token({ required: true }), middleware(), actions.index);

router.get('/check', token({ required: true }), middleware(), actions.checkRead);

router.get('/setRead', token({ required: true }), middleware(), actions.setRead);


router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.post('/test', token({ required: true }), actions.test);


export default router;

