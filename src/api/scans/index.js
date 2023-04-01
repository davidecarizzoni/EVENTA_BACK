import {Router} from 'express';
import {token} from '../auth/passport';
import {actions} from './controller';
import {middleware} from 'querymen';
import {Schema} from 'mongoose';

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

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.delete('/:id', token({ required: true }), actions.destroy);

export default router;
