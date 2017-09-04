/* global google */
import {connect} from 'react-firebase';
import React, {Component} from 'react';
import Moment from 'react-moment';
import PropTypes from 'prop-types';
import {config} from './firebase';
import Map from './Map';
import './App.css';

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
    previousPolygon: null,
    fence: null,
    watchID: null,
    lastFetched: null,
    fences: {},
  };

  doneDrawing = (polygon) => {
    if (this.state.previousPolygon) {
      this.state.previousPolygon.setMap(null);
    }

    this.setState({previousPolygon: polygon});

    const vertices = polygon.getPath();

    this.setState({
      fence: new google.maps.Polygon({
        paths: vertices,
      }),
    });

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
        fenceStatus = <p>You are inside the fence.</p>;
      } else {
        fenceStatus = <p>You are outside the fence.</p>;
      }
    } else {
      fenceStatus = <p>You need to check if you are inside the fences.</p>;
    }

    if (this.state.lastFetched) {
      map = (<div>
        <p>
          Last fetched: <Moment interval={10000} fromNow>{this.state.lastFetched}</Moment>
        </p>
        <Map
          googleMapURL={googleMapURL}
          loadingElement={
            <p>Loading maps...</p>
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
        <button onClick={this.checkGeofence}>Check fence</button>
      </div>);
    } else {
      map = <p>Getting location...</p>;
    }

    return (
      <div className="App">
        {map}
        {fenceStatus}
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
