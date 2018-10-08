var amqp = require('amqplib/callback_api'),
  url = require('url');

var uri = "", channel, connection;
if (process.env.NODE_ENV === "production") {
  uri = 'amqps://admin:FEKLGLODRKRXXZOY@portal-ssl393-14.bmix-lon-yp-a40cde9e-7953-48f5-a71b-0a8e0489cd87.359159694.composedb.com:29533/bmix-lon-yp-a40cde9e-7953-48f5-a71b-0a8e0489cd87';
} else {
  uri = 'amqp://root:123qwe@192.168.161.224:5672';
}

exports.connect = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(uri, { servername: url.parse(uri).hostname }, (err, conn) => {
      if (err) { reject(err); }
      conn.createChannel((err, ch) => {
        if (err) { conn.close(); reject(err); }

        connection = conn;
        channel = ch;

        _connectToExchanges().then(
          () => resolve(),
          err => reject(err));
      });

    });
  });
}

exports.getChannel = () => { return channel; }

exports.disconnect = () => {
  channel.close();
  connection.close();
}

_connectToExchanges = () => {
  return new Promise((resolve, reject) => {
    require("./business/get_vitaboxes").list().then(
      vitaboxes => {
        vitaboxes.push("admin");
        Promise.all(vitaboxes.map(vitabox => _subscribeToVitabox( vitabox))).then(
          () => resolve(),
          error => reject(error));
      }, error => reject(error));
  });
}

_subscribeToVitabox = (vitabox) => {
  return new Promise((resolve, reject) => {
    channel.assertExchange(vitabox, 'fanout', { durable: true });
    //setup a queue for receiving messages
    channel.assertQueue('', { exclusive: true }, function (err, q) {
      if (err) reject(err);
      channel.bindQueue(q.queue, vitabox, '');
      resolve();
    });
  });
}