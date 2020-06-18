import React, { createContext, useEffect, useCallback, useReducer, useContext } from 'react';

const AuthContext = createContext();

const AuthProvider = props => {

  let [user, dispatch] = useReducer((state, action) => {
    return action;
  }, {})

  // callback that reloads user data from api
  let onReloadNeeded = useCallback(async () => {
    let r = await fetch("/api/userdata");
    let user = r.status==200 ? await r.json() : {error: "Not authenticated"};
    dispatch(user);
    return user;
  })

  // load user data on mount
  useEffect(() => {
    onReloadNeeded();
  }, []);

  // pass callback down to children through context so that data can be reloaded on demand
  return (
    <AuthContext.Provider value={{onReloadNeeded, user}} {...props}/>
  );
}

function useAuth() {
  return useContext(AuthContext);
}

export {AuthContext, useAuth, AuthProvider}