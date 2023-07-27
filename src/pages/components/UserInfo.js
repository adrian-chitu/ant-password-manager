// Importuri
import * as React from 'react';
import {useState, useEffect} from 'react';
import CircularProgress from '@mui/material/CircularProgress';
import {createClient} from '@supabase/supabase-js';
import {
  Typography,
  TextField,
  Box,
  Button,
  Snackbar,
  FormControl,
  IconButton,
  FilledInput,
  InputLabel,
  InputAdornment,
  Alert,
  Grid,
} from '@mui/material';

import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Instantierea legaturii cu baza de date
const supabase = createClient(
    `${process.env.GATSBY_SUPABASE_URL}`,
    `${process.env.GATSBY_SUPABASE_ANON_KEY}`,
);

// Componenta UserInfo
const UserInfo = (props) => {
  const {userId, email} = props;

  // State-uri de React
  const [passwords, setPasswords] = useState([]);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [open, setOpen] = useState(false);
  const [showPassword, setShowPassword] = React.useState({});
  const [secretKey, setSecretKey] = useState(null);

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

  useEffect(() => {
    // Generate a secret key for encryption and decryption
    const generateKey = async () => {
      const key = await crypto.subtle.generateKey(
          {name: 'AES-GCM', length: 256},
          true,
          ['encrypt', 'decrypt'],
      );
      setSecretKey(key);
    };
    generateKey();
  }, []);

  // Functii helper
  // -----------------------------------------------
  const arrayBufferToBase64 = (buffer) => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  };

  const base64ToArrayBuffer = (base64) => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // -----------------------

  // Encriptarea datelor
  // ---------------------

  const encryptData = async (data) => {
    const encoder = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        {name: 'AES-GCM', iv: iv},
        secretKey,
        encoder.encode(data),
    );

    // Convertim ArrayBuffer la Base64
    const base64 = arrayBufferToBase64(encrypted);
    console.log('Encrypted data in Base64:', base64);
    return {encrypted: base64, iv: iv};
  };

  // ---------------------

  // Decriptarea datelor
  // -------------------
  const decryptData = async (encryptedBase64, iv) => {
    // Convertim Base64 in ArrayBuffer
    const encryptedArrayBuffer = base64ToArrayBuffer(encryptedBase64);

    // Decriptarea datelor
    const decrypted = await crypto.subtle.decrypt(
        {name: 'AES-GCM', iv: iv}, // Use the iv passed to the function
        secretKey,
        encryptedArrayBuffer,
    );

    // Convertirea datelor in string
    const decoder = new TextDecoder();
    const decryptedString = decoder.decode(decrypted);
    console.log('Decrypted data:', decryptedString);
    return decryptedString;
  };

  // Functie care verifica si retrage datele din DB
  // In cazul in care un user nu exista va fi creat
  const fetchPasswords = async () => {
    const {data: userData, error} = await supabase
        .from('users')
        .select('*')
        .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user:', error);
      return;
    }

    if (userData.length === 0) {
      const {error: insertError} = await supabase
          .from('users')
          .insert([{user_id: userId, email: email}]);

      if (insertError) {
        console.error('Error inserting new user:', insertError);
        return;
      }
    }

    const {data: passwordsData, error: passwordsError} = await supabase
        .from('passwords')
        .select('*')
        .eq('user_id', userId);

    if (passwordsError) {
      console.error('Error fetching passwords:', passwordsError);
      return;
    }

    setPasswords(passwordsData || []);
  };

  // Functie submit pentru insertia parolelor in DB
  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      if (
        siteName === '' ||
        siteUrl === '' ||
        username === '' ||
        password === ''
      ) {
        setOpen(true);
        return;
      }

      const {encrypted, iv} = await encryptData(password);

      const {data, error} = await supabase.from('passwords').insert([
        {
          user_id: userId,
          site_name: siteName,
          site_url: siteUrl,
          username,
          password: encrypted,
          iv: arrayBufferToBase64(iv),
        },
      ]);

      if (error) {
        console.error('Error inserting password:', error);
        return;
      }

      setSiteName('');
      setSiteUrl('');
      setUsername('');
      setPassword('');

      setPasswords((prevPasswords) => [...prevPasswords, ...data]);
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
  };

  // Functie pentru stergerea parolelor din DB
  const handleDelete = async (id) => {
    try {
      const {error} = await supabase.from('passwords').delete().match({id});

      if (error) {
        console.error('Error deleting password:', error);
        return;
      }

      setPasswords((prevPasswords) => prevPasswords.filter((x) => x.id !== id));
    } catch (error) {
      console.error('An unexpected error occurred:', error);
    }
  };

  useEffect(() => {
    if (secretKey) {
      encryptData('sal').then(({encrypted, iv}) => {
        console.log('Encrypted data in Base64:', encrypted);

        // Decrypting the data
        decryptData(encrypted, iv).then((decryptedString) => {
          console.log('Decrypted data:', decryptedString);
        });
      });
    }
  }, [secretKey]);

  return (
    <main>
      <title>Home Page</title>
      {/* Render conditional pentru a incarca datele */}
      {passwords ? (
        <>
          <Typography variant="h5" mb={3}>
            Numar intrari : {passwords.length}
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
                        label="Name"
                        variant="filled"
                        value={passwordEntry.site_name}
                      />
                    </Grid>

                    <Grid item xs={12} md={2.75}>
                      <TextField
                        id="outlined-basic"
                        label="Website URL"
                        variant="filled"
                        value={passwordEntry.site_url}
                      />
                    </Grid>

                    <Grid item xs={12} md={2.75}>
                      <TextField
                        id="outlined-basic"
                        label="Username"
                        variant="filled"
                        value={passwordEntry.username}
                      />
                    </Grid>

                    <Grid item xs={12} md={3.2}>
                      <FormControl variant="filled">
                        <InputLabel
                          htmlFor={passwordEntry.site_name + 'outlineBasicId'}
                        >
                          Password
                        </InputLabel>
                        <FilledInput
                          id={passwordEntry.site_name + 'outlineBasicId'}
                          type={
                            showPassword[passwordEntry.site_name] ?
                              'text' :
                              'password'
                          }
                          endAdornment={
                            <InputAdornment position="end">
                              <IconButton
                                sx={{mr: 0.1}}
                                onClick={() =>
                                  handleClickShowPassword(
                                      passwordEntry.site_name,
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
                                      passwordEntry.password,
                                  );
                                }}
                              >
                                {' '}
                                <ContentCopyIcon />
                              </IconButton>
                            </InputAdornment>
                          }
                          label="Password"
                          value={passwordEntry.password}

                        />
                      </FormControl>
                    </Grid>

                    <Grid item xs={12} md={0.5}>
                      <Button
                        variant="contained"
                        color="error"
                        onClick={() => {
                          handleDelete(passwordEntry.id);
                        }}
                        sx={{p: 2}}
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

          <Box
            component="form"
            noValidate
            autoComplete="off"
            display={'flex'}
            mt={10}
          >
            <Grid container spacing={1}>
              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="Site Name"
                  variant="outlined"
                  value={siteName}
                  onChange={(e) => setSiteName(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="Site URL"
                  variant="outlined"
                  value={siteUrl}
                  onChange={(e) => setSiteUrl(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="Username"
                  variant="outlined"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </Grid>

              <Grid item xs={12} md={2.75}>
                <TextField
                  id="outlined-basic"
                  label="Password"
                  variant="outlined"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={{height: '100%'}}
                />
              </Grid>

              <Grid item xs={12} md={1}>
                <Button
                  variant="contained"
                  onClick={handleSubmit}
                  color="success"
                  sx={{p: 2}}
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
        open={open}
        autoHideDuration={6000}
        onClose={() => setOpen(false)}
      >
        <Alert severity="error">Te rog introdu toate detaliile</Alert>
      </Snackbar>
    </main>
  );
};

export default UserInfo;
