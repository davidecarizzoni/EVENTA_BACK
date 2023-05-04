import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';
import { Schema } from 'mongoose';
const { upload } = require('../../services/uploadController');


const router = new Router();

const queryBody = {
  userId: {
    type: Schema.Types.ObjectId
  },
};

// GET NOTES

router.get('/', token({ required: true }), middleware(queryBody), actions.index);

router.get('/homeStories', token({ required: true }), middleware(queryBody), actions.homeStories);

router.get('/:id', token({ required: true }), actions.show);

// ACTIONS

router.post('/', token({ required: true }), actions.create);

router.put('/:id/', token({ required: false }), actions.update);

router.put('/:id/contentImage', token({ required: false }), upload.single("file"), actions.contentImage);

router.delete('/:id', token({ required: true }), actions.destroy);

export default router;

