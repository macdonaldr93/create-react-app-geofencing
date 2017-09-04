import {connect} from 'react-firebase';
import React, {Component} from 'react';
import Moment from 'react-moment';
import PropTypes from 'prop-types';
import Typography from 'material-ui/Typography';
import AppBar from 'material-ui/AppBar';
import Toolbar from 'material-ui/Toolbar';
import Button from 'material-ui/Button';
import {config} from './helpers/firebase';
import AuthForm from './components/AuthForm';
import Map from './components/Map';
import './styles/App.css';

const googleMapURL = `https://maps.googleapis.com/maps/api/js?libraries=geometry,drawing&key=${process.env.REACT_APP_MAPS_API_KEY}`;

class App extends Component {
  state = {
    center: {
      // CN Tower default
      lat: 43.642558,
      lng: -79.387046,
    },
    content: 'Getting position...',
    checkedOnce: false,
    insideFence: false,
    fence: null,
    watchID: null,
    lastFetched: null,
    fences: {},
  };

  doneDrawing = (polygon) => {
    const vertices = polygon.getPath();
    const paths = [];

    for (let i = 0; i < vertices.getLength(); i++) {
      const xy = vertices.getAt(i);
      paths.push({
        lat: xy.lat(),
        lng: xy.lng(),
      });
    }

    this.props.addFence({
      paths,
      createdAt: Date.now(),
    });
  };

  checkGeofence = () => {
    if (!this.state.center.lat || !this.state.center.lng) {
      return;
    }

    const fetchOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'POST',
      body: JSON.stringify({
        latitude: this.state.center.lat,
        longitude: this.state.center.lng,
      }),
    };

    fetch(`${config.functionsURL}/checkGeofence`, fetchOptions)
      .then((response) => {
        if (response.ok) {
          return response.json();
        }

        throw new Error('Network response was not ok.');
      })
      .then((json) => {
        this.setState({
          insideFence: json.message,
        });

        if (!this.checkedOnce) {
          this.setState({
            checkedOnce: true,
          });
        }

        return json.message;
      })
      .catch((err) => {
        // eslint-disable-next-line
        console.error(err);
      });
  };

  componentDidMount() {
    this.watchLocation();
  }

  componentWillUnmount() {
    this.unwatchLocation();
  }

  watchLocation() {
    if (!('geolocation' in navigator)) {
      return;
    }

    const geoOptions = {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 27000,
    };

    navigator.geolocation.watchPosition(this.getLocation.bind(this), null, geoOptions);
  }

  unwatchLocation() {
    if ('geolocation' in navigator && this.state.watchID) {
      navigator.geolocation.clearWatch(this.state.watchID);
    }
  }

  getLocation(position) {
    this.setState({
      center: {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      },
      content: 'Location found.',
      lastFetched: position.timestamp,
    });
  }

  render() {
    let map = null;
    let fenceStatus = null;

    if (this.state.checkedOnce) {
      if (this.state.insideFence) {
        fenceStatus = <Typography gutterBottom>You are inside the fence.</Typography>;
      } else {
        fenceStatus = <Typography gutterBottom>You are outside the fence.</Typography>;
      }
    }

    if (this.state.lastFetched) {
      map = (<div>
        <Map
          googleMapURL={googleMapURL}
          loadingElement={
            <Typography>Loading maps...</Typography>
          }
          containerElement={
            <div className="map-container" />
          }
          mapElement={
            <div className="map" />
          }
          fences={this.props.fences}
          center={this.state.center}
          content={this.state.content}
          doneDrawing={this.doneDrawing}
        />
        <Typography type="subheading" gutterBottom>
          Last fetched: <Moment interval={10000} fromNow>{this.state.lastFetched}</Moment>
        </Typography>
        {fenceStatus}
        <Button
          color="primary"
          onClick={this.checkGeofence}
        >
          Check fence
        </Button>
      </div>);
    } else {
      map = <Typography type="subheading" gutterBottom>Getting location...</Typography>;
    }

    return (
      <div className="App">
        <AppBar position="static">
          <Toolbar>
            <Typography type="title" color="inherit">
              Geofencing
            </Typography>
          </Toolbar>
        </AppBar>
        {map}
        <AuthForm />
      </div>
    );
  }
}

App.propTypes = {
  fences: PropTypes.object,
  addFence: PropTypes.func,
};

function mapFirebaseToProps(props, ref) {
  return {
    fences: 'fences',
    addFence: (fence) => ref('fences').push(fence),
  };
}

export default connect(mapFirebaseToProps)(App);
