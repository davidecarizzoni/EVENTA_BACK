import {Router} from 'express';
import {token} from '../auth/passport';
import {actions} from './controller';
import {middleware, Schema as QuerySchema} from 'querymen';
import {Schema} from 'mongoose';

const router = new Router();

const schema = new QuerySchema({
	eventId: Schema.Types.ObjectId
});

router.get('/', token({ required: true }), middleware(schema), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

