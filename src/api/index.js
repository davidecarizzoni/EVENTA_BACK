import { Router } from 'express';
import users from "./users";
import events from "./events";
import auth from "./auth";

const router = new Router();

router.use('/users', users)
router.use('/events', events)
router.use('/auth', auth)

export default router;
