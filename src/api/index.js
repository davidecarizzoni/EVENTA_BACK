import { Router } from 'express';
import users from './users';
import events from './events';
import partecipants from './partecipants';
import follow from './follow';
import auth from './auth';

const router = new Router();

router.use('/users', users);
router.use('/events', events);
router.use('/partecipants', partecipants);
router.use('/follow', follow);
router.use('/auth', auth);

export default router;
