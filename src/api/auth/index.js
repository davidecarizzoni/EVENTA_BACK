import { Router } from 'express';

import { token, password } from './passport';
import { actions } from '../users/controller';
import {googleLogin, login} from './controller';

const router = new Router();

router.post('/register', token({ required: false }), actions.create);
router.post('/login', password(), login);
router.post('/google', token({ required: false }), googleLogin);

export default router;
