const passport = require('passport');
const express = require('express');

const router = express.Router();
const jwt = require('jsonwebtoken');


//  SIGN UP API (based on strategy in /auth/controller)
router.post('/signup', passport.authenticate('signup', { session: false }),
  async (req, res, next) => {
    res.json({
      message: 'Sign Up successful',
      user: req.body
    });
  }
);

router.post('/login', async (req, res, next) => {
    passport.authenticate('login', async (error, user, info) => {
        try {
          //ERROR HANDLING
          if (error) {
            return next(error); //Generates HTTP 500
          }
          if(!user){
            return res.send({success: false, message: "Authentification failed"})
          }

          req.login(user, { session: false }, async (loginError) => {
              if (loginError) return next(loginError);

              const body = { _id: user._id, email: user.email };
              const token = jwt.sign({ user: body }, 'TOP_SECRET');

              return res.json({ message: "Authentication succeded", token });
          });

        } catch (error) {
          return next(error);
        }
      }
    )(req, res, next);
  }
);

module.exports = router;