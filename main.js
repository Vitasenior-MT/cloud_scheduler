// main.js

// BASE SETUP
// =============================================================================
// Get the env variables from .env
require('dotenv').config();

Promise.all([
  require('./src/models/index').sequelize.sync(),
  require("./src/broker_connect").connect()
]).then(
  () => {
    // console.log('\x1b[32m%s\x1b[0m.', '(PLAIN) Connection established with MySQL and RabbitMQ');

    let express = require('express');
    var server = require('http').Server(express());

    require('./src/business/schedule').startLoop();

    let port = process.env.PORT || 8800;
    server.listen(port, () => {
      console.log('\x1b[32m%s %d\x1b[0m.', '(PLAIN) Server listening on port', port);
    });

  }, error => { console.log('Unable to connect to Databases and broker server.', error); process.exit(1); });
