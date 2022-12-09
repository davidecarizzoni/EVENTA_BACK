import { Router } from 'express';
import users from "./users";
import auth from "./auth";
const router = new Router();

router.use('/users', users)
router.use('/auth', auth)
// router.use('/events',require('./events'))
// router.use('/auth', require('./auth'))

export default router;
