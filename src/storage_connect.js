var AWS = require('ibm-cos-sdk'), store;

exports.connectToStorage = () => {
  return new Promise((resolve, reject) => {
    store = new AWS.S3({
      endpoint: process.env.STORE_ENDPOINT,
      apiKeyId: process.env.STORE_APIKEY,
      ibmAuthEndpoint: process.env.STORE_AUTHENDPOINT,
      serviceInstanceId: process.env.STORE_INSTANCE,
    });
    resolve();
  });
}

exports.uploadFile = (bucketName, itemName, fileData) => {
  return new Promise((resolve, reject) => {
    store.upload({ Bucket: bucketName, Key: itemName, Body: fileData }, { partSize: 5242880, queueSize: 1 }).promise()
      .then(() => resolve())
      .catch(error => reject({ code: 500, msg: error.message }));
  });
}