var amqp = require('amqplib/callback_api'),
  url = require('url');

var uri = "";
if (process.env.NODE_ENV === "production") {
  uri = 'amqps://admin:FEKLGLODRKRXXZOY@portal-ssl393-14.bmix-lon-yp-a40cde9e-7953-48f5-a71b-0a8e0489cd87.359159694.composedb.com:29533/bmix-lon-yp-a40cde9e-7953-48f5-a71b-0a8e0489cd87';
} else {
  uri = 'amqp://root:123qwe@192.168.161.224:5672';
}

exports.connect = () => {
  return new Promise((resolve, reject) => {
    amqp.connect(uri, { servername: url.parse(uri).hostname }, (err, conn) => {
      if (err) reject(err);
      else conn.createChannel((err, channel) => {
        if (err) { conn.close(); reject(err); }
        else resolve(channel);
      });
    });
  });
}