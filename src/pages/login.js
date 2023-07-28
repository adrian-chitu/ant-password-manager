import React from "react";
import { SignIn } from "gatsby-plugin-clerk";

const LoginPage = () => {
  return (
    <div>
      <SignIn path="/login" routing="path" />
    </div>
  );
};

export default LoginPage;
