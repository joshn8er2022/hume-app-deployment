const express = require('express');
const path = require('path');
const router = express.Router();

// Root path response - serve React app
router.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

router.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// Catch-all handler: send back React's index.html file for client-side routing
router.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

module.exports = router;
