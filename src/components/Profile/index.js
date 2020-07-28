import React from 'react';
import { useAuth } from '../../utils/AuthContext';
import { useHistory } from 'react-router-dom';

const Profile = () => {

  const { push } = useHistory();
  const auth = useAuth();
  // if not logged in, go back from this page
  if (!(auth && auth.user)) {
    push("gallery");
    return null;
  }
  return (
    <div className="boxContainer">
      <h1>{auth.user.username}</h1>
      <p>Join date: {auth.user.registeredOn?.replace(/T.*/, "")}</p>
    </div>
  )
}

export default Profile;