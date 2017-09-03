/* global google */
import React, {Component} from 'react';
import Moment from 'react-moment';
import Map from './Map';
import './App.css';

const googleMapURL = `https://maps.googleapis.com/maps/api/js?libraries=geometry,drawing&key=${process.env.REACT_APP_MAPS_API_KEY}`;

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      center: {
        // CN Tower default
        lat: 43.642558,
        lng: -79.387046,
      },
      content: 'Getting position...',
      insideFence: false,
      previousPolygon: null,
      fence: null,
      watchID: null,
      lastFetched: null,
    };
  }

  componentDidMount() {
    this.watchLocation();
  }

  componentWillUnmount() {
    this.unwatchLocation();
  }

  watchLocation() {
    if ('geolocation' in navigator) {
      const geoOptions = {
        enableHighAccuracy: true,
        maximumAge : 30000,
        timeout : 27000
      };

      navigator.geolocation.watchPosition(this.getLocation.bind(this), null, geoOptions);
    } else {
      alert('Geolocation is not supported by this browser.');
    }
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
      content: `Location found.`,
      lastFetched: position.timestamp,
    });

    this.checkGeofence();
  }

  checkGeofence() {
    if (!this.state.fence) {
      this.setState({
        insideFence: false,
      });
      return;
    }

    const insideFence = google.maps.geometry.poly
      .containsLocation(this.getCurrentPosition(), this.state.fence);

    this.setState({
      insideFence,
    });
  }

  doneDrawing(polygon) {
    if (this.state.previousPolygon) {
      this.state.previousPolygon.setMap(null);
    }

    this.setState({previousPolygon: polygon});

    this.setState({
      fence: new google.maps.Polygon({
        paths: polygon.getPaths(),
      }),
    });

    this.checkGeofence();
  }

  getCurrentPosition() {
    const currentPosition = new google.maps.LatLng(this.state.center.lat, this.state.center.lng);
    return currentPosition;
  }

  render() {
    let map = null;
    let fenceStatus = null;

    if (this.state.fence) {
      if (this.state.insideFence) {
        fenceStatus = <p>You are inside the fence.</p>;
      } else {
        fenceStatus = <p>You are outside the fence.</p>;
      }
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
          center={this.state.center}
          content={this.state.content}
          doneDrawing={this.doneDrawing.bind(this)}
        />
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

export default App;
