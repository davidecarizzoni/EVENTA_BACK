import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config';

const sign = async (id, options) => await jwt.sign({ id }, JWT_SECRET, options);

export const login = ({ user }, res) => sign(user.id).then((token) => res.send({ token, user }));


