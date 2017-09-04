const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({origin: true});
const {isPointInside} = require('geolib');

function checkRequest(req) {
  const requiredFields = [];

  if (!req.body.longitude) {
    requiredFields.push('longitude is required');
  }

  if (!req.body.latitude) {
    requiredFields.push('latitude is required');
  }

  return requiredFields;
}

module.exports = functions.https.onRequest((req, res) => {
  cors(req, res, () => {
    const errors = checkRequest(req);

    if (errors.length > 0) {
      res.status(422).send({
        status: 422,
        message: errors.join(', '),
      });

      return;
    }

    // Grab the text parameter.
    const longitude = req.body.longitude;
    const latitude = req.body.latitude;

    // Push the new message into the Realtime Database using the Firebase Admin SDK.
    const fencesRef = admin.database().ref('/fences').orderByKey();
    fencesRef
      .once('value')
      .then((snapshot) => {
        let insideFence = false;

        snapshot.forEach((childSnapshot) => {
          if (insideFence) {
            return;
          }

          const fence = childSnapshot.val();

          const pathsArray = Array.from(fence.paths).map((path) => {
            return {
              latitude: path.lat,
              longitude: path.lng,
            };
          });

          insideFence = isPointInside({
            latitude,
            longitude,
          }, pathsArray);
        });

        return insideFence;
      })
      .then((response) => {
        return res.status(200).send({
          status: 200,
          message: response,
        });
      })
      .catch(() => {
        res.status(500).send({
          status: 500,
          message: 'Something went wrong!',
        });
      });
  });
});
