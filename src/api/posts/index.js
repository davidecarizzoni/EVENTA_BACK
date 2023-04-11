import {Router} from 'express';
import {token} from '../auth/passport';
import {actions} from './controller';
import {middleware} from 'querymen';
import {Schema} from 'mongoose';
const { upload } = require('../../services/uploadController');

const queryBody = {
	q: {
		type: String, parse: (value, field) => {
			return {
				$or: [
					{ name: { $regex: value, $options: 'i' } },
				]
			};
		}
	},
	eventId: {
		type: Schema.Types.ObjectId
	},
  userId: {
		type: Schema.Types.ObjectId
	},
	
}

const router = new Router();

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/home', token({ required: true }), middleware(queryBody), actions.homePosts);


router.post('/:id/like', token({ required: true }), actions.like);

router.delete('/:id/unlike', token({ required: true }), actions.unlike);


router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/postImage', token({ required: false }), upload.single("file"), actions.postImage);

router.delete('/:id', token({ required: true }), actions.destroy);

export default router;
