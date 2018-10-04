var db = require('../models/index'),
  broker = require('../broker_connect');

exports.startLoop = () => {
  var interval = setInterval(_dostuff, 5000);
}

_dostuff = () => {
  db.PatientBoard.findAll({
    where: { frequency: { $ne: null } },
    include: [
      { model: db.Patient, include: [{ model: db.Vitabox }] },
      { model: db.Board }
    ]
  }).then(
    x => {
      x.map(y => {
        console.log("last commit: ", y.last_commit)
        if ((y.frequency * 3600000) > (new Date() - new Date(y.Board.last_commit)) || !y.last_commit) {
          broker.getChannel().publish(y.Patient.Vitabox.id, '', new Buffer(JSON.stringify({ content: "notification", msg: "exam late" })));
        }
        else console.log("feito");
      })

    }, error => console.log(error));
}
