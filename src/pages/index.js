// Importuri
import * as React from "react";
import UserInfo from "./components/UserInfo";
import { SignIn, UserButton, useUser, useAuth } from "gatsby-plugin-clerk";
import { Container, Typography, Box } from "@mui/material";

// Componenta index
const IndexPage = () => {
  // Hook-uri chemate din plugin-ul Clerk.js
  const user = useUser().user;
  const auth = useAuth();

  // Functie cu un parametru care schimba prima litera in majuscula
  const capitalize = (word) => {
    const lower = word.toLowerCase();
    return word.charAt(0).toUpperCase() + lower.slice(1);
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h2" textAlign={"center"} mb={5} mt={10}>
        Manager parole - ANT
      </Typography>

      {/* Verificarea sesiunii si daca utilizatorul este logat */}
      {/* Render conditional in functie de starea user-ului */}
      {auth.isSignedIn ? (
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 5,
            }}
          >
            <Typography variant="h4" textAlign={"center"}>
              Bine ai venit, {capitalize(user.username)} 👋🏻
            </Typography>
            <UserButton />
          </Box>

          <UserInfo
            userId={user.id}
            email={user.primaryEmailAddress.emailAddress}
          />
        </Box>
      ) : (
        <Box display={"flex"} flexDirection={"column"} alignItems={"center"}>
          <SignIn />
        </Box>
      )}
    </Container>
  );
};

export default IndexPage;

export const Head = () => <title>ANT</title>;
