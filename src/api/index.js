import { Router } from 'express';
import users from './users';
import events from './events';
import follow from './follow';
import participants from './participants';
import likes from './likes';
import auth from './auth';
import notes from './notes';

const router = new Router();

router.use('/users', users);
router.use('/events', events);
router.use('/follow', follow);
router.use('/likes', likes);
router.use('/notes', notes);
router.use('/participants', participants);
router.use('/auth', auth);

export default router;
