var db = require('../models/index'),
  storage = require('../storage_connect'),
  utils = require('./utils');

exports.execute = function itself() {
  let limit_day = new Date();
  limit_day.setDate(limit_day.getDate() - 1); // last day
  let today = new Date();                     // until now
  db.Record.find().where({ datetime: { $gte: new Date(limit_day), $lte: today } }).exec((error, records) => {
    if (error) {
      console.log("Data recover: ERROR - ", error.message);
      setTimeout(itself, 86400000);
    } else {
      if (records.length > 0) {
        let promises = [];
        if (records.filter(x => x.patient_id).length > 0) promises.push(_collectByPatients(records.filter(x => x.patient_id), today));
        if (records.filter(x => x.patient_id === null).length > 0) promises.push(_collectByBoards(records.filter(x => x.patient_id === null), today));
        Promise.all(promises)
          .then(() => setTimeout(itself, 86400000))
          .catch(e => {
            console.log("Data recover: ERROR - ", e.message ? e.message : e.msg);
            setTimeout(itself, 86400000);
          });
      } else { setTimeout(itself, 86400000); }
    }
  });
}

_collectByPatients = (records, today) => {
  return new Promise((resolve, reject) => {
    let to_store = [];
    Promise.all([
      db.Sensor.findAll({
        where: { id: { $in: [...new Set(records.map(item => item.sensor_id))] } },
        include: [{ model: db.Sensormodel, attributes: ['tag'] }]
      }),
      db.Patient.findAll({
        where: { id: { $in: [...new Set(records.map(item => item.patient_id))] } },
        include: [{ model: db.Vitabox, attributes: ['locality', 'district'] }, { model: db.Profile, attributes: ['tag', 'min_nightly', 'max_nightly', 'min_diurnal', 'max_diurnal'] }]
      })
    ]).then(
      res => {
        res[1].forEach(patient => {
          let matched = records.filter(x => x.patient_id === patient.id);
          matched.forEach(record => {
            let sensor = res[0].find(sensor => sensor.id === record.sensor_id);
            let profile = patient.Profiles.find(x => x.tag === sensor.Sensormodel.tag);
            let min = profile.min_diurnal, max = profile.max_diurnal, hour = new Date(record.datetime).getHours();
            if (hour < 9 || hour >= 18) {
              min = profile.min_nightly;
              max = profile.max_nightly;
            }
            to_store.push({
              value: record.value,
              datetime: record.datetime.toISOString(),
              age: utils.getAge(new Date(patient.birthdate)),
              gender: patient.gender,
              height: patient.height,
              weight: patient.weight,
              locality: utils.decrypt(patient.Vitabox.locality),
              district: utils.decrypt(patient.Vitabox.district),
              tag: sensor.Sensormodel.tag,
              warning: record.value > max || record.value < min,
              min: min,
              max: max
            });
          });
        });

        let fileName = today.toISOString() + '_bio.csv';
        let created = false;
        utils.saveCSV(to_store, fileName).then(() => {
          created = true;
          return utils.readFile(fileName)
        }).then(fileData => {
          return storage.uploadFile(process.env.STORE_ANALYTIC_BUCKET, fileName, fileData)
        }).then(() => {
          return utils.removeFile(fileName)
        }).then(() => {
          console.log("Biometric data recover: DONE");
          resolve();
        }).catch(e => {
          if (created) utils.removeFile(fileName).then(() => { });
          reject(e);
        });

      }).catch(e => reject(e));
  })
}

_collectByBoards = (records, today) => {
  return new Promise((resolve, reject) => {
    let to_store = [];
    db.Sensor.findAll({
      where: { id: { $in: [...new Set(records.map(item => item.sensor_id))] } },
      include: [
        { model: db.Sensormodel, attributes: ['tag', 'max_acceptable', 'min_acceptable'] },
        {
          model: db.Board, include: [
            { model: db.Vitabox, attributes: ['locality', 'district'] }
          ]
        }
      ]
    }).then(
      sensors => {
        sensors.forEach(sensor => {
          let matched = records.filter(x => x.sensor_id === sensor.id);
          matched.forEach(record => {
            to_store.push({
              value: record.value,
              datetime: record.datetime.toISOString(),
              locality: utils.decrypt(sensor.Board.Vitabox.locality),
              district: utils.decrypt(sensor.Board.Vitabox.district),
              tag: sensor.Sensormodel.tag,
              warning: record.value > sensor.Sensormodel.max_acceptable || record.value < sensor.Sensormodel.min_acceptable,
              min: sensor.Sensormodel.min_acceptable,
              max: sensor.Sensormodel.max_acceptable
            });
          });
        });

        let fileName = today.toISOString() + '_env.csv';
        let created = false;
        utils.saveCSV(to_store, fileName).then(() => {
          created = true;
          return utils.readFile(fileName)
        }).then(fileData => {
          return storage.uploadFile(process.env.STORE_ANALYTIC_BUCKET, fileName, fileData)
        }).then(() => {
          return utils.removeFile(fileName)
        }).then(() => {
          console.log("Environmental data recover: DONE");
          resolve();
        }).catch(e => {
          if (created) utils.removeFile(fileName).then(() => { });
          reject(e);
        });
      }).catch(e => reject(e));
  })
}