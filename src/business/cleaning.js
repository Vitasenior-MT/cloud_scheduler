var db = require('../models/index');

exports.execute = function itself() {
  promises = [
    // remove bio warnings
    new Promise((resolve, reject) => {
      let limit_day = new Date();
      limit_day.setDate(limit_day.getDate() - 30);
      db.Warning.deleteMany({ datetime: { $lte: new Date(limit_day) }, patient_id: { $ne: null } }).exec((err, res) => {
        if (err) reject(err);
        else resolve(res.n);
      });
    }),
    // remove env warnings
    new Promise((resolve, reject) => {
      let limit_day = new Date();
      limit_day.setDate(limit_day.getDate() - 15);
      db.Warning.deleteMany({ datetime: { $lte: new Date(limit_day) }, patient_id: null }).exec((err, res) => {
        if (err) reject(err);
        else resolve(res.n);
      });
    })
  ];

  Promise.all(promises).then(
    res => {
      console.log("\x1b[36mwarnings removed: %d\x1b[0m", res.reduce((a, b) => a + b, 0));
      let timeout = 86400000; // 24h
      // let timeout = 30000; // 20 seconds
      setTimeout(itself, timeout);
    },
    error => {
      console.log(error);
      setTimeout(itself, 86400000);
    });
}