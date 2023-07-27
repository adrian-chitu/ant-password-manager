import React from 'react';
import {SignIn} from '@clerk/clerk-react';

const LoginPage = () => {
  return (
    <div>
      <SignIn path="/login" routing="path" />
    </div>
  );
};

export default LoginPage;
