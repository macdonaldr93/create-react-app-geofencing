import React from 'react';
import ReactDOM from 'react-dom';
import initFirebase from './firebase';
import './index.css';
import App from './App';
import registerServiceWorker from './registerServiceWorker';

initFirebase();
ReactDOM.render(<App />, document.getElementById('root'));
registerServiceWorker();
