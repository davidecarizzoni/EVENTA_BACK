import {Router} from 'express';
import {token} from '../auth/passport';
import {actions} from './controller';
import {middleware} from 'querymen';
import { Schema } from 'mongoose';
const { upload } = require('../../services/uploadController');

const queryBody = {
	q: {
		type: String, parse: (value, field) => {
			return {
				$or: [
					{ name: { $regex: value, $options: 'i' } },
					{ description: { $regex: value, $options: 'i' } }
				]
			};
		}
	},
	organiserId: {
		type: Schema.Types.ObjectId
	},
	date:{
		type: Date
	},
	search:{
		type: String,
	}
}

const router = new Router();

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.get('/:id/participants', token({ required: true }), middleware(queryBody), actions.participants);


router.post('/:id/participate', token({ required: true }), actions.participate);

router.delete('/:id/unparticipate', token({ required: true }), actions.unparticipate);

router.post('/', token({ required: false }), actions.create);


router.put('/:id', token({ required: true }), actions.update);

router.put('/:id/coverImage', token({ required: false }), upload.single("file"), actions.coverImage);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

