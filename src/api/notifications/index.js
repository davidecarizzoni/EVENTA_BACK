import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';

const router = new Router();

const queryBody = {
	userId: {
		type: String
	},
}

router.get('/me', token({ required: true }), middleware(queryBody), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/test', token({ required: true }), actions.test);


export default router;

