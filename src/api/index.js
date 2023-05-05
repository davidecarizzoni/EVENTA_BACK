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
import scans from './scans';
import reports from './reports';
import comments from './comments';
import notifications from './notifications';
import stories from './stories';
import blocks from './blocks';

const router = new Router();

router.use('/users', users);
router.use('/events', events);
router.use('/follow', follow);
router.use('/likes', likes);
router.use('/notes', notes);
router.use('/fires', fires);
router.use('/posts', posts);
router.use('/scans', scans);
router.use('/reports', reports);
router.use('/comments', comments);
router.use('/stories', stories);
router.use('/blocks', blocks);
router.use('/notifications', notifications);
router.use('/participants', participants);
router.use('/auth', auth);

export default router;
