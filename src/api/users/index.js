import { Router } from 'express';
import { admin, password, token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';

const router = new Router();

router.get('/', token({ required: false }), middleware(), actions.index);

router.get('/me', token({ required: true }), actions.showMe);

router.get('/:id', admin, actions.show);

router.post('/', admin, actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/password', password(), actions.updatePassword);

router.delete('/:id', admin, actions.destroy);

export default router;
