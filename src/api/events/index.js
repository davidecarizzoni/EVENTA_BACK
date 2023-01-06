import { Router } from 'express';
import { token } from '../auth/passport';
import { actions } from './controller';
import { middleware } from 'querymen';
const upload = require('../../services/uploadController');


const router = new Router();

router.get('/', token({ required: true }), middleware(), actions.index);

router.get('/:id', token({ required: true }), actions.show);

router.post('/', token({ required: true }), upload.single('eventImage'), actions.create);

router.put('/:id', token({ required: true }), actions.update);

router.delete('/:id', token({ required: true }), actions.destroy);


export default router;

