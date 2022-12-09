import jwt from 'jsonwebtoken';
import  { JWT_SECRET } from "../../config";
import { Promise } from 'bluebird';

const sign = (id, options) => Promise.promisify(jwt.sign)({ id }, JWT_SECRET, options);

export const login = ({ user }, res, next) => sign(user.id)
  .then(async (token) => await Promise.all([token, user]))
  .then(([token, userView]) => res.send({
    token,
    user: userView
  }));
