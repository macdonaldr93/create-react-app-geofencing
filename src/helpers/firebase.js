import firebase from 'firebase/app';

export const config = {
  apiKey: process.env.REACT_APP_FB_API_KEY,
  authDomain: `${process.env.REACT_APP_FB_ID}.firebaseapp.com`,
  databaseURL: `https://${process.env.REACT_APP_FB_ID}.firebaseio.com`,
  functionsURL: `https://us-central1-${process.env.REACT_APP_FB_ID}.cloudfunctions.net`,
  projectId: process.env.REACT_APP_FB_ID,
  storageBucket: '',
  messagingSenderId: process.env.REACT_APP_FB_SENDER_ID,
};

export default function initFirebase() {
  const app = firebase.initializeApp(config);
  return app;
}
