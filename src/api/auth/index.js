import { Router } from 'express';

import { token, password } from '../../services/passport';
import { actions } from '../users/controller';
import { login } from './controller';

const router = new Router();

router.post('/register', token({ required: false }), actions.create);
router.post('/login', password(), login);

export default router;
