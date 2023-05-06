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

const fieldBody = {
	field: {
		type: String
	},
	value: {
		type: String,
	}
}

// GET USERS

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/recommended', token({ required: true }), middleware(followerBody), actions.recommended);

router.get('/analytics', token({ required: true }), middleware(queryBody), actions.analytics)

router.get('/me', token({ required: true }), actions.showMe);

router.get('/checkField', token({ required: true }), middleware(fieldBody), actions.checkField)


router.get('/:userFieldId/getField', token({ required: true }), middleware(fieldBody), actions.getUserField);

router.get('/:userId', admin, actions.show);


router.get('/:id/followed', token({ required: true }), middleware(followerBody), actions.followed);

router.get('/:id/followers', token({ required: true }), middleware(followerBody), actions.followers);

// GET ENTITIES

router.get('/:id/posts', token({ required: true }), middleware(followerBody), actions.showPostsForUser);

router.get('/:id/events', token({ required: true }), middleware(followerBody), actions.showEventsForUser);

// ACTIONS

router.post('/:id/follow', token({ required: true }), actions.follow);

router.delete('/:id/unfollow', token({ required: true }), actions.unfollow);

router.delete('/:id/unfollowBlocked', token({ required: true }), actions.unfollowBlocked);

// USER API

router.post('/', admin, actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/profilePic', token({ required: true }), upload.single("file"), actions.profilePic);

router.put('/:id/password', password(), actions.updatePassword);

router.delete('/me', token({ required: true }), actions.deleteMe);

router.delete('/:id', admin, actions.destroy);



export default router;
