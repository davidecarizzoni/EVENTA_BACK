const User  = require('./model')
const express  = require('express')
const bcrypt  = require('bcrypt')
const mongoose = require('mongoose');
const router = express.Router();

//  GET USERS WITHOUT PASSWORD
router.get('/', async (req, res) => {
  const userList = await User.find()

  if(!userList) {
    res.status(500).json({success: false})
  }
  res.send(userList);
})

//  GET USERS BY ID 
router.get('/:id', async (req, res) => {
  const user = await User.findById(req.params.id);

  if(!user) {
    res.status(500).json({message: 'the user with the given ID was not found'});
  }
  res.status(200).send(user);
})

module.exports = router;