// server.js

// BASE SETUP
// =============================================================================
// Get the env variables from .env
if (process.env.NODE_ENV === "development") {
  require('dotenv').config();
}

Promise.all([
  require('./src/models/index').sequelize.sync(),
  require("./src/broker_connect").connectToBroker(),
  require("./src/storage_connect").connectToStorage()
]).then(
  () => {
    console.log('\x1b[32m(PLAIN) Connection established with External Services\x1b[0m.');

    let express = require('express');
    var server = require('http').Server(express());

    var business = require('./src/business/index');

    business.exams.execute();
    business.cleaning.execute();
    business.datarecover.execute();

    let port = process.env.PORT || 8800;
    server.listen(port, () => {
      console.log('\x1b[32m%s %d\x1b[0m.', '(PLAIN) Server listening on port', port);
    });

  }, error => { console.log('Unable to connect to External Services.', error); process.exit(1); });
