import React from "react";
import { SignUp } from "gatsby-plugin-clerk";

const SignUpPage = () => {
  return (
    <div>
      <SignUp path="/signup" routing="path" />
    </div>
  );
};

export default SignUpPage;
