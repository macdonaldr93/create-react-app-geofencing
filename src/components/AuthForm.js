import React, {Component} from 'react';
import firebase from 'firebase';
import Button from 'material-ui/Button';
import Input from 'material-ui/Input';
import InputLabel from 'material-ui/Input/InputLabel';
import FormControl from 'material-ui/Form/FormControl';
import FormHelperText from 'material-ui/Form/FormHelperText';
import {authWithPhoneNumber, verifyConfirmationCode} from '../helpers/auth';

class AuthForm extends Component {
  state = {
    phoneNumber: '',
    code: '',
    confirming: false,
    recaptcha: false,
    currentUser: null,
  };

  handlePhoneNumberChange = (event) => {
    this.setState({phoneNumber: event.target.value});
  };

  handlePhoneNumberSubmit = () => {
    if (!this.state.phoneNumber) {
      return;
    }

    this.setState({confirming: true});
    authWithPhoneNumber(this.state.phoneNumber, this.verifier)
      .catch(() => {
        this.setState({confirming: false});
      });
  };

  handleCodeChange = (event) => {
    this.setState({code: event.target.value});
  };

  handleCodeSubmit = () => {
    if (!this.state.code) {
      return;
    }

    this.setState({confirming: false});
    verifyConfirmationCode(this.state.code)
      .then((response) => {
        return this.setState({
          currentUser: response.user,
        });
      })
      .catch((err) => {
        // eslint-disable-next-line
        console.error(err);
      });
  };

  componentDidMount() {
    firebase.auth().useDeviceLanguage();

    this.verifier = new firebase.auth.RecaptchaVerifier('recaptcha', {
      size: 'invisible',
      callback: () => {
        this.setState({
          recaptcha: true,
        });
      },
    });

    firebase
      .auth()
      .setPersistence(firebase.auth.Auth.Persistence.LOCAL);

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          currentUser: user,
        });
      } else {
        this.setState({
          currentUser: null,
        });
      }
    });
  }

  render() {
    return (
      <div>
        {this.state.confirming ? (
          <FormControl>
            <InputLabel htmlFor="Auth-Confirmation-Code">Confirmation code</InputLabel>
            <Input id="Auth-Confirmation-Code" value={this.state.code} onChange={this.handleCodeChange} />
            <Button onClick={this.handleCodeSubmit}>Confirm</Button>
          </FormControl>
        ) : (
          <FormControl>
            <InputLabel htmlFor="Auth-Phone-Number">Phone number</InputLabel>
            <Input id="Auth-Phone-Number" value={this.state.phoneNumber} onChange={this.handlePhoneNumberChange} />
            <FormHelperText>+1 111-111-1111</FormHelperText>
            <Button id="Auth-Phone-Submit" onClick={this.handlePhoneNumberSubmit}>Login</Button>
          </FormControl>
        )}
        {this.state.currentUser && this.state.currentUser.phoneNumber}
        <div id="recaptcha" />
      </div>
    );
  }
}

export default AuthForm;
