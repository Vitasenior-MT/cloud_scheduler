var db = require('../models/index'),
  utils = require('./utils'),
  broker = require('../broker_connect');

exports.execute = function itself() {

  let now = new Date();

  db.PatientBoard.findAll({
    where: { frequency: { $ne: null } },
    include: [
      { model: db.Patient },
      { model: db.Board, include: [{ model: db.Boardmodel }] }
    ]
  }).then(
    patient_boards => {
      promises = patient_boards.map(patient_board => new Promise((resolve, reject) => {
        if (patient_board.frequency !== null && (patient_board.frequency == 1 || patient_board.last_commit == null || now - new Date(patient_board.last_commit) > 86400000 * patient_board.frequency - 7200000)) {
          let update = false, to_update = [];
          patient_board.schedules.map(schedule => {
            if (schedule == now.getHours() && (!patient_board.last_commit || new Date(patient_board.last_commit).getHours() < (now.getHours() - 2))) {
              update = true;
              to_update.push(patient_board.Board.Boardmodel.name);
            }
          });
          if (update) {
            Promise.all([
              new Promise((resolve, reject) =>
                broker.subscribeToEntity(patient_board.Patient.vitabox_id).then(
                  () => {
                    broker.getChannel().publish(
                      patient_board.Patient.vitabox_id,
                      'unicast',
                      new Buffer(JSON.stringify({
                        content: "schedule",
                        msg: {
                          tag: patient_board.Board.Boardmodel.tag,
                          message: utils.decrypt(patient_board.Patient.name) + " deve realizar o(s) exame(s) de " + to_update.join(", ")
                        }
                      })));
                    resolve();
                  }, error => reject(error))),
              patient_board.update({ last_schedule: new Date })
            ])
              .then(() => resolve(1))
              .catch(e => reject(e));
          } else { resolve(0) }
        } else { resolve(0) }
      }));
      Promise.all(promises).then(
        res => {
          console.log("\x1b[36mexams scheduled: %d, notifications: %s\x1b[0m", patient_boards.length, res.reduce((a, b) => a + b, 0));

          let timeout = 3600000 - (new Date() - now); // 1h - count
          // let timeout = 15000; // 20 seconds
          setTimeout(itself, timeout);
        },
        error => {
          console.log(error);
          setTimeout(itself, 3600000 - patient_boards.length);
        });
    }, error => {
      console.log(error);
      setTimeout(itself, 3600000);
    });
}
