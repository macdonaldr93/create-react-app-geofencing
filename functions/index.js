const functions = require('firebase-functions');
const admin = require('firebase-admin');
const checkGeofence = require('./checkGeofence');

admin.initializeApp(functions.config().firebase);

module.exports = {
  checkGeofence,
};
