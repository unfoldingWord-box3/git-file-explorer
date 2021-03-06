import React from 'react';
import PropTypes from 'prop-types';

import { useAuthentication } from '.';

export const AuthenticationContext = React.createContext();

export function AuthenticationContextProvider({
  config: _config,
  messages,
  authentication,
  onAuthentication,
  loadAuthentication,
  saveAuthentication,
  children,
  onError,
}) {
  const {
    state, actions, component, config,
  } = useAuthentication({
    authentication,
    onAuthentication,
    config: _config,
    messages,
    loadAuthentication,
    saveAuthentication,
    onError,
  });
  const context = {
    state,
    actions,
    component,
    config,
  };

  return (
    <AuthenticationContext.Provider value={context}>
      {children}
    </AuthenticationContext.Provider>
  );
};

AuthenticationContextProvider.propTypes = {
  /** Pass a previously returned authentication object to bypass login. */
  authentication: PropTypes.shape({
    user: PropTypes.object.isRequired,
    token: PropTypes.object.isRequired,
    config: PropTypes.object.isRequired,
    remember: PropTypes.bool,
  }),
  /** Callback function to propogate the user/token used for API Authentication. */
  onAuthentication: PropTypes.func,
  /** Configuration to pass through to the Authentication component. */
  /** Override the default text and errors. Must override all or none. */
  messages: PropTypes.shape({
    actionText: PropTypes.string.isRequired,
    genericError: PropTypes.string.isRequired,
    usernameError: PropTypes.string.isRequired,
    passwordError: PropTypes.string.isRequired,
  }),
  config: PropTypes.shape({
    /** The Gitea server to use when authenticating. */
    server: PropTypes.string.isRequired,
    /** The id of the token to create/retrieve that is used for the app. */
    tokenid: PropTypes.string.isRequired,
  }),
  /** Callback function to persist authentication. */
  saveAuthentication: PropTypes.func,
  /** Callback function to retrieve persisted authentication. */
  loadAuthentication: PropTypes.func,
  /** optional callback for error */
  onError: PropTypes.func,
};
