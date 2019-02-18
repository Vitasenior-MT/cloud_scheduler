var amqp = require('amqplib/callback_api'),
  url = require('url');

var channel, connection;

exports.connectToBroker = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(process.env.AMQP, { servername: url.parse(process.env.AMQP).hostname }, (err, conn) => {
      if (err) { reject(err); }
      else conn.createChannel((err, ch) => {
        if (err) { conn.close(); reject(err); }

        connection = conn;
        channel = ch;
        resolve();
      });

    });
  });
}

exports.getChannel = () => { return channel; }

exports.disconnect = () => {
  channel.close();
  connection.close();
}

exports.subscribeToEntity = (entity_id) => {
  return new Promise((resolve, reject) => {
    channel.assertExchange(entity_id, 'direct', { autoDelete: true, durable: false }, function (err, ok) {
      if (err) reject(err);
      else resolve();
    });
  });
}