import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';
import {Schema} from 'mongoose';

const router = new Router();

const queryBody = {
	noteId: {
		type: Schema.Types.ObjectId
	},
  userId: {
		type: Schema.Types.ObjectId
	},
}

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/:id', token({ required: true }), actions.show);

// router.get('/:id', token({ required: true }), actions.userFires);

router.post('/', token({ required: true }), actions.create);

router.delete('/:id', token({ required: true }), actions.destroy);

export default router;

