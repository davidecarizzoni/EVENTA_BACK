import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import {middleware, Schema as QuerySchema} from 'querymen';
const { upload } = require('../../services/uploadController');

import {Event} from './model';
import {createQuerymenSchema } from '../../services/queryController';
const eventQuerymenSchema = createQuerymenSchema(Event.schema);

const router = new Router();

router.get('/', token({ required: true }), middleware(eventQuerymenSchema), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.get('/:id/participants', token({ required: true }), middleware(), actions.participants);

router.post('/', token({ required: false }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/coverImage', token({ required: false }), upload.single("file"), actions.coverImage);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

