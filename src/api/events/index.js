import {Router} from 'express';
import {token} from '../auth/passport';
import {actions} from './controller';
import {middleware} from 'querymen';
import {Event} from './model';
import {createQuerymenSchema} from '../../services/queryController';

const { upload } = require('../../services/uploadController');

const eventQuerymenSchema = createQuerymenSchema(Event.schema, {
	q: {
		type: RegExp,
		paths: ['name'],
	}
});

const router = new Router();

router.get('/', token({ required: true }), middleware(eventQuerymenSchema), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.get('/:id/show/participants', token({ required: true }), middleware(), actions.showParticipants);

router.post('/:id/participate', token({ required: true }), actions.participate);

router.delete('/:id/unparticipate', token({ required: true }), actions.unparticipate);

router.post('/', token({ required: false }), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/coverImage', token({ required: false }), upload.single("file"), actions.coverImage);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

