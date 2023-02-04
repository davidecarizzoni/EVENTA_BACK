import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';

import {Follow} from './model';
import {createQuerymenSchema } from '../../services/queryController';
const eventQuerymenSchema = createQuerymenSchema(Follow.schema);

const router = new Router();

router.get('/', token({ required: true }), middleware(eventQuerymenSchema), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

