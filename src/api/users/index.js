import { Router } from 'express';
import { admin, password, token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';

const { upload } = require('../../services/uploadController');
const router = new Router();


const queryBody = {
	q: {
		type: String, parse: (value, field) => {
			return {
				$or: [
					{ name: { $regex: value, $options: 'i' } },
					{ username: { $regex: value, $options: 'i' } }
				]
			};
		}
	},
	role: {
		type: String
	},
}

const followerBody = {
	search: {
		type: String
	},
	role: {
		type: String
	},
}

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/me', token({ required: true }), actions.showMe);

router.get('/:id', admin, actions.show);

router.post('/', admin, actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/profilePic', token({ required: true }), upload.single("file"), actions.profilePic);

router.put('/:id/password', password(), actions.updatePassword);

router.delete('/me', token({ required: true }), actions.deleteMe);

router.delete('/:id', admin, actions.destroy);

// POSTS
router.get('/:id/posts', token({ required: true }), middleware(followerBody), actions.showPostsForUser);

// EVENTS
router.get('/:id/events', token({ required: true }), middleware(followerBody), actions.showEventsForUser);

// FOLLOW
router.delete('/:id/unfollow', token({ required: true }), actions.unfollow);

router.get('/:id/followed', token({ required: true }), middleware(followerBody), actions.followed);

router.post('/:id/follow', token({ required: true }), actions.follow);

router.get('/:id/followers', token({ required: true }), middleware(followerBody), actions.followers);



export default router;
