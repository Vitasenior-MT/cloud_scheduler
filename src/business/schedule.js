var db = require('../models/index'),
  utils = require('./utils'),
  broker = require('../broker_connect');

exports.startLoop = () => {
  _startInterval(5000)
}

_startInterval = (_interval) => {
  setTimeout(_dostuff, _interval);
}

_adjustInterval = (count, notifications) => {
  // let timeout = 1800000 - count;
  // _startInterval(timeout / 180);
  console.log("exams scheduled: ", count, "notifications: ", notifications);
  _startInterval(1800000 - count);
}

_dostuff = () => {
  db.PatientBoard.findAll({
    where: { frequency: { $ne: null } },
    include: [
      { model: db.Patient, include: [{ model: db.Vitabox }] },
      { model: db.Board, include: [{ model: db.Boardmodel }] }
    ]
  }).then(
    x => {
      let notifications = 0;
      x.map(y => {
        if ((y.frequency * 3600000) > (new Date() - new Date(y.Board.last_commit)) || !y.last_commit) {
          notifications += 1;
          broker.subscribeToEntity(y.Patient.Vitabox.id).then(
            () => broker.getChannel().publish(y.Patient.Vitabox.id, 'unicast', new Buffer(JSON.stringify({ content: "notification", msg: utils.decrypt(y.Patient.name) + " deve realizar o exame de " + y.Board.Boardmodel.name }))),
            error => console.log(error));
        }
      });
      _adjustInterval(x.length, notifications);
    }, error => console.log(error));
}
