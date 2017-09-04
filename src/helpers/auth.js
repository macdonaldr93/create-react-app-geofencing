import firebase from 'firebase';
import 'firebase/auth';

let confirmationCode = null;
let appVerifier = null;

export function verifyConfirmationCode(code) {
  return confirmationCode
    .confirm(code)
    .then((result) => {
      return result;
    })
    .catch((error) => {
      // eslint-disable-next-line
      console.error(error);
    });
}

export function authWithPhoneNumber(phoneNumber, recaptchaVerifier) {
  appVerifier = recaptchaVerifier;

  return firebase.auth()
    .signInWithPhoneNumber(phoneNumber, appVerifier)
    .then((confirmationResult) => {
      // SMS sent. Prompt user to type the code from the message, then sign the
      // user in with confirmationResult.confirm(code).
      confirmationCode = confirmationResult;
      return null;
    })
    .catch((error) => {
      // eslint-disable-next-line
      console.error(error);
    });
}
