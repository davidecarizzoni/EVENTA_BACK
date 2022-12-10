const Event = require('./model');
const express = require('express');
const router = express.Router();

//  GET USERS WITHOUT PASSWORD
router.get('/', async (req, res) => {
  const eventList = await Event.find();

  if (!eventList) {
    res.status(500).json({ success: false });
  }
  res.send(eventList);
});

//  GET USERS BY ID
router.get('/:id', async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(500).json({ message: 'the event with the given ID was not found' });
  }
  res.status(200).send(event);
});

router.post('/', async (req, res) => {
    let event = new Event(req.body);
    event = await event.save();

    if (!event) {
        return res.status(404).send('The event cannot be created');
    }
    res.send(event);
});

module.exports = router;
