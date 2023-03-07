import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';
import { Schema } from 'mongoose';

const router = new Router();

const queryBody = {
	followerId: {
		type: Schema.Types.ObjectId
	},
  followedId: {
		type: Schema.Types.ObjectId
	},
	name: {
		type: String,
	}

}

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/:id', token({ required: true }), actions.show);

// router.get('/search', token({ required: true }), middleware(queryBody), actions.searchFollower);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

