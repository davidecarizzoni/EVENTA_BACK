import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';
import { Schema } from 'mongoose';

const router = new Router();

const queryBody = {
	objectId: {
		type: Schema.Types.ObjectId
	},
  userId: {
		type: Schema.Types.ObjectId
	},
	search :{
		type: String,
	}
}


router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

