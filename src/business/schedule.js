var db = require('../models/index'),
  utils = require('./utils'),
  broker = require('../broker_connect');

exports.startLoop = () => {
  _startInterval(5000)
}

_startInterval = (_interval) => {
  setTimeout(_dostuff, _interval);
}

_adjustInterval = (count) => {
  // let timeout = 1800000 - count;
  // console.log(timeout);
  // _startInterval(timeout / 360);
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
      x.map(y => {
        // console.log("last commit: ", utils.decrypt(y.Patient.name) + " deve realizar o exame de " + y.Board.Boardmodel.name);
        if ((y.frequency * 3600000) > (new Date() - new Date(y.Board.last_commit)) || !y.last_commit) {
          broker.getChannel().publish(y.Patient.Vitabox.id, '', new Buffer(JSON.stringify({ content: "notification", msg: utils.decrypt(y.Patient.name) + " deve realizar o exame de " + y.Board.Boardmodel.name })));
        }
        // else console.log("feito");
      });
      _adjustInterval(x.length);

    }, error => console.log(error));
}
