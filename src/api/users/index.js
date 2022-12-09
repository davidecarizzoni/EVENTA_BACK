import { Router } from 'express';
import { admin, password as passwordAuth, token } from '../../services/passport';
import { actions } from './controller';
import { middleware as query } from 'querymen';

const router = new Router();

router.get('/', token({ required: false }), query(), actions.index);

router.get('/me', token({ required: true }), actions.showMe);

router.get('/:id', admin, actions.show);

router.post('/', admin, actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/password', passwordAuth(), actions.updatePassword);

router.delete('/:id', admin, actions.destroy);

export default router;
