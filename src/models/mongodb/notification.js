var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  emitter_id: {
    type: String,
    required: true
  },
  emitter: {
    type: String,
    required: true
  },
  vitabox_id: {
    type: String,
    required: true
  },
  vitabox: {
    type: String,
    required: true
  },
  patient_id: {
    type: String,
    default: null
  },
  patient: {
    type: String,
    default: null
  },
  send_date: {
    type: Date,
    required: true
  },
  check_date: {
    type: Date,
    default: null
  },
  message: {
    type: String,
    required: true
  }
}, {
    versionKey: false,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  });

module.exports = mongoose.model('Notification', schema);