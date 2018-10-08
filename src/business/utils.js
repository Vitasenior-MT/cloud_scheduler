var crypto = require("crypto");

exports.decrypt = (to_decrypt) => {
  let decipher = crypto.createDecipher(process.env.ALGORITHM, process.env.KEY);
  return decipher.update(to_decrypt, 'hex', 'utf8') + decipher.final('utf8');
}