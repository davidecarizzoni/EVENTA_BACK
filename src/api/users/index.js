import { Router } from 'express';
import { admin, password, token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';
import { Schema } from 'mongoose';

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

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/me', token({ required: true }), actions.showMe);

router.get('/:id', admin, actions.show);

router.post('/', admin, actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.post('/:id/follow', token({ required: true }), actions.follow);

router.delete('/:id/unfollow', token({ required: true }), actions.unfollow);

router.put('/:id/profilePic', token({ required: true }), upload.single("file"), actions.profilePic);

router.put('/:id/password', password(), actions.updatePassword);

router.delete('/:id', admin, actions.destroy);

export default router;
