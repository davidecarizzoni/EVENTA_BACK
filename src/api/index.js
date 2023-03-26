import { Router } from 'express';
import users from './users';
import events from './events';
import follow from './follow';
import participants from './participants';
import likes from './likes';
import auth from './auth';
import notes from './notes';
import fires from './fires'
import posts from './posts';
import discount from './discount';

const router = new Router();

router.use('/users', users);
router.use('/events', events);
router.use('/follow', follow);
router.use('/likes', likes);
router.use('/notes', notes);
router.use('/fires', fires);
router.use('/posts', posts);
router.use('/discount', discount);
router.use('/participants', participants);
router.use('/auth', auth);

export default router;
