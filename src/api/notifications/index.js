import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';

const router = new Router();


router.get('/me', token({ required: true }), middleware(), actions.index);

router.get('/read', token({ required: true }), middleware(), actions.read);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.post('/test', token({ required: true }), actions.test);


export default router;

