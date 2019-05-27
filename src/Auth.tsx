import * as React from "react";
import auth0 from "auth0-js";

import { AUTH_CONFIG } from "./auth0-variables";
import { AuthProvider } from "./authContext";

const auth = new auth0.WebAuth({
  domain: AUTH_CONFIG.domain,
  clientID: AUTH_CONFIG.clientId,
  redirectUri: AUTH_CONFIG.callbackUrl,
  audience: `https://${AUTH_CONFIG.domain}/userinfo`,
  responseType: "token id_token"
});

interface IProps {}
interface IState {
  authenticated: boolean;
  user: any;
  accessToken: string;
}

class Auth extends React.Component<IProps, IState> {
  constructor(props: IProps) {
    super(props);

    this.state = {
      authenticated: false,
      user: {
        role: "visitor"
      },
      accessToken: ""
    };
  }

  initiateLogin = () => {
    auth.authorize();
  };

  logout = () => {
    this.setState(
      { 
        authenticated: false,
        user: {
          role: "visitor"
        },
        accessToken: ""
      },
      () => console.log("#logout")
    );
  };

  handleAuthentication = () => {
    auth.parseHash((error, authResult) => {
      if (error) {
        console.log(error);
        console.log(`Error ${error.error} occured`);
        return;
      }

      this.setSession(authResult.idTokenPayload);
    });
  };

  setSession = data => {
    console.log("#Auth0 session data ", data);
    const user = {
      id: data.sub,
      email: data.email,
      role: data[AUTH_CONFIG.roleUrl]
    };
    this.setState({
      authenticated: true,
      accessToken: data.accessToken,
      user
    });
  };

  render() {
    const authProviderValue = {
      ...this.state,
      initiateLogin: this.initiateLogin,
      handleAuthentication: this.handleAuthentication,
      logout: this.logout
    };
    return (
      <AuthProvider value={authProviderValue}>
        {this.props.children}
      </AuthProvider>
    );
  }
}

export default Auth;
