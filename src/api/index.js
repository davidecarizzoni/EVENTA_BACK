import { Router } from 'express';
import users from './users';
import events from './events';
import follow from './follow';
import partecipants from './partecipants';
import likes from './likes';
import auth from './auth';

const router = new Router();

router.use('/users', users);
router.use('/events', events);
router.use('/follow', follow);
router.use('/likes', likes);
router.use('/partecipants', partecipants);
router.use('/auth', auth);

export default router;
