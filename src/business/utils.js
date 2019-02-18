var crypto = require("crypto"),
  fs = require('fs'),
  path = require('path'),
  os = require('os');

exports.decrypt = (to_decrypt) => {
  let decipher = crypto.createDecipher(process.env.CIPHER_ALGORITHM, process.env.CIPHER_KEY);
  return decipher.update(to_decrypt, 'hex', 'utf8') + decipher.final('utf8');
}

exports.getAge = (birthday) => {
  let ageDifMs = Date.now() - birthday.getTime();
  let ageDate = new Date(ageDifMs);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

exports.saveCSV = (objs, filename) => {
  return new Promise((resolve, reject) => {
    let file = path.resolve(__dirname, '..', filename);
    let output = [], keys = Object.keys(objs[0]);

    objs.forEach(obj => {
      let row = []; // a new array for each row of data
      keys.forEach(key => row.push(obj[key]));
      output.push(row.join());
    });

    fs.writeFile(file, output.join(os.EOL), (err) => {
      if (err) reject(err);
      else resolve(file);
    });
  })
}

exports.readFile = (filename) => {
  return new Promise((resolve, reject) => {
    fs.readFile(path.resolve(__dirname, '..', filename), (err, fileData) => {
      if (err) reject(err);
      else resolve(fileData);
    });
  });
}

exports.removeFile = (filename) => {
  return new Promise((resolve, reject) => {
    fs.unlink(path.resolve(__dirname, '..', filename), (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}