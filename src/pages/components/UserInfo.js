// Importuri
import * as React from "react";
import { useState, useEffect } from "react";

import CryptoJS from "crypto-js";
import { createClient } from "@supabase/supabase-js";

import {
  Typography,
  TextField,
  Box,
  Button,
  Snackbar,
  IconButton,
  InputAdornment,
  Alert,
  Grid,
  CircularProgress,
} from "@mui/material";

import DeleteForeverIcon from "@mui/icons-material/DeleteForever";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";

// Instantierea legaturii cu baza de date
const supabase = createClient(
  `${process.env.GATSBY_SUPABASE_URL}`,
  `${process.env.GATSBY_SUPABASE_ANON_KEY}`
);

// Componenta UserInfo
const UserInfo = (props) => {
  const { userId, email } = props;

  // State-uri
  const [passwords, setPasswords] = useState([]);
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState({});

  const [notification, setNotification] = useState({
    message: "",
    severity: "",
    open: false,
  });

  // Functie care face toggle state-ului aferent intrarii selectate
  const handleClickShowPassword = (siteName) => {
    setShowPassword((prevState) => ({
      ...prevState,
      [siteName]: !prevState[siteName],
    }));
  };

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  // Hook pentru preluarea datelor din DB
  useEffect(() => {
    fetchPasswords();
  }, []);

  // Functie pentru criptarea datelor
  const encryptData = async (data) => {
    const encryptionKey = `${process.env.GATSBY_ENCRYPTION_KEY}`;

    const encrypted = CryptoJS.AES.encrypt(data, encryptionKey).toString();

    return { encrypted };
  };

  // Functie pentru decriptarea datelor
  const decryptData = (data) => {
    const encryptionKey = `${process.env.GATSBY_ENCRYPTION_KEY}`;

    const bytes = CryptoJS.AES.decrypt(data, encryptionKey);
    const originalText = bytes.toString(CryptoJS.enc.Utf8);

    return { originalText };
  };

  // Functie care verifica si retrage datele din DB
  // In cazul in care un user nu exista va fi creat
  const fetchPasswords = async () => {
    const { data: userData, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user:", error);
      return;
    }

    if (userData.length === 0) {
      const { error: insertError } = await supabase
        .from("users")
        .insert([{ user_id: userId, email: email }]);

      if (insertError) {
        console.error("Error inserting new user:", insertError);
        return;
      }
    }

    const { data: passwordsData, error: passwordsError } = await supabase
      .from("passwords")
      .select("*")
      .eq("user_id", userId);

    if (passwordsError) {
      console.error("Error fetching passwords:", passwordsError);
      return;
    }

    setPasswords(passwordsData || []);
  };

  // Functie submit pentru insertia parolelor in DB
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (
        siteName === "" ||
        siteUrl === "" ||
        username === "" ||
        password === ""
      ) {
        setNotification({
          message: "Va rugam completati toate campurile!",
          severity: "error",
          open: true,
        });
        return;
      }

      if (passwords.some((x) => x.site_name === siteName)) {
        setNotification({
          message: "Parola pentru acest website exista deja!",
          severity: "error",
          open: true,
        });
        return;
      }

      if (!siteUrl.startsWith("http://") && !siteUrl.startsWith("https://")) {
        setNotification({
          message: "Va rugam introduceti o adresa URL valida!",
          severity: "error",
          open: true,
        });
        return;
      }

      const encrypted = (await encryptData(password)).encrypted;

      const { data, error } = await supabase.from("passwords").insert([
        {
          user_id: userId,
          site_name: siteName,
          site_url: siteUrl,
          username,
          password: encrypted,
        },
      ]);

      if (error) {
        console.error("Error inserting password:", error);
        return;
      }

      setSiteName("");
      setSiteUrl("");
      setUsername("");
      setPassword("");

      setNotification({
        message: "Parola a fost adaugata cu succes!",
        severity: "success",
        open: true,
      });

      setPasswords((prevPasswords) => [...prevPasswords, ...data]);
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

  // Functie pentru stergerea parolelor din DB
  const handleDelete = async (id) => {
    try {
      const { error } = await supabase.from("passwords").delete().match({ id });

      if (error) {
        console.error("Error deleting password:", error);
        return;
      }

      setPasswords((prevPasswords) => prevPasswords.filter((x) => x.id !== id));
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

  return (
    <>
      {/* Render conditional pentru a incarca datele */}
      {passwords ? (
        <>
          <Typography variant="h5" mb={3}>
            Ai salvate: {passwords.length} parole 🔐
          </Typography>

          {passwords.length > 0 ? (
            <Box>
              {passwords.map((passwordEntry) => {
                return (
                  <Grid
                    container
                    key={passwordEntry.site_name}
                    spacing={1}
                    mb={3}
                  >
                    <Grid item xs={12} md={2.75}>
                      <TextField
                        id="outlined-basic"
                        label="Nume website"
                        variant="filled"
                        value={passwordEntry.site_name}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={2.75}>
                      <TextField
                        id="outlined-basic"
                        label="URL"
                        variant="filled"
                        value={passwordEntry.site_url}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={2.75}>
                      <TextField
                        id="outlined-basic"
                        label="Utilizator"
                        variant="filled"
                        value={passwordEntry.username}
                        InputProps={{
                          readOnly: true,
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} md={3.2}>
                      <TextField
                        id="outlined-basic"
                        label="Parola"
                        variant="filled"
                        value={decryptData(passwordEntry.password).originalText}
                        InputProps={{
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                sx={{ mr: 0.1 }}
                                onClick={() =>
                                  handleClickShowPassword(
                                    passwordEntry.site_name
                                  )
                                }
                                onMouseDown={handleMouseDownPassword}
                                edge="end"
                              >
                                {showPassword[passwordEntry.site_name] ? (
                                  <VisibilityOff />
                                ) : (
                                  <Visibility />
                                )}
                              </IconButton>
                              <IconButton
                                onClick={() => {
                                  navigator.clipboard.writeText(
                                    decryptData(passwordEntry.password)
                                      .originalText
                                  );
                                  setNotification({
                                    message: "Parola copiata in clipboard!",
                                    severity: "success",
                                    open: true,
                                  });
                                }}
                              >
                                {" "}
                                <ContentCopyIcon />
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        helperText={new Date(
                          passwordEntry.updated_at
                        ).toLocaleDateString("ro-RO", {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })}
                        type={
                          showPassword[passwordEntry.site_name]
                            ? "text"
                            : "password"
                        }
                      />
                    </Grid>

                    <Grid item xs={12} md={0.5}>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                          handleDelete(passwordEntry.id);
                          setNotification({
                            message: "Parola stearsa cu succes!",
                            severity: "success",
                            open: true,
                          });
                        }}
                        sx={{ p: 2 }}
                      >
                        <DeleteForeverIcon />
                      </Button>
                    </Grid>
                  </Grid>
                );
              })}
            </Box>
          ) : (
            <Typography variant="h4">
              Nu ai salvat inca nicio parola 🤩
            </Typography>
          )}

          <Box mt={10}>
            <Typography variant="h5" mb={3}>
              Adauga o parola noua 🔑
            </Typography>
            <Grid container spacing={1}>
              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="Nume website"
                  variant="outlined"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="URL"
                  variant="outlined"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="Utilizator"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="Parola"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{ height: "100%" }}
                />
              </Grid>

              <Grid item xs={12} md={1}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  color="success"
                  sx={{ p: 2 }}
                >
                  Adauga
                </Button>
              </Grid>
            </Grid>
          </Box>
        </>
      ) : (
        <CircularProgress />
      )}

      <Snackbar
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        open={notification.open}
        autoHideDuration={3000}
        onClose={() =>
          setNotification({
            ...notification,
            message: "",
            severity: "",
            open: false,
          })
        }
      >
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>
    </>
  );
};

export default UserInfo;
