import {Router} from 'express';
import {token} from '../auth/passport';
import {actions} from './controller';
import {middleware, Schema as QuerySchema} from 'querymen';

import {Participant} from './model';
import {createQuerymenSchema } from '../../services/queryController';
const eventQuerymenSchema = createQuerymenSchema(Participant.schema);

const router = new Router();

router.get('/', token({ required: true }), middleware(eventQuerymenSchema), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

