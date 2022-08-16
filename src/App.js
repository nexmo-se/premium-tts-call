import React, { useState, useEffect } from 'react';
import {Buffer} from 'buffer';
import {Stack, Box, Typography} from '@mui/material';
import LoginBox from './components/LoginBox.js';
import TextBox from './components/TextBox.js';
import EventsBox from './components/EventsBox.js';
import { v4 as uuidv4 } from 'uuid';

import './App.css';

const BaseURL = process.env.PUBLIC_URL? process.env.PUBLIC_URL : 'http://localhost:3002';

function App() {
  const [user, setUser] = useState(null);

  // const handleLogin = (user) => {
  //   console.log('App handleLogin', user.username )
  //   setUser(user)
  // };
  
  const getQueryVariable = function (variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
        var pair = vars[i].split( "=" );
        if (pair[0] == variable) {
            return pair[1];
        }
    }
    return(false);
  }

  const parseVidsJwt = function (token) {
    try {
      return JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    } catch (e) {console.error(e)}
    return null;
  }

  useEffect(() => {
    // get rid of the “Start” button and go straight into the demo
    var vids = getQueryVariable('jwt');
    vids = vids? vids: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyaWQiOjMzNiwicGFydG5lciI6MCwidXNlcm5hbWUiOiJ5aW5waW5nLmdlQHZvbmFnZS5jb20iLCJmaXJzdG5hbWUiOiJZaW5waW5nIiwibGFzdG5hbWUiOiJHZSIsInJvbGUiOiJiZXRhIiwicGhvbmUiOiIiLCJyZWdpb24iOiJVUyIsImxhbmd1YWdlIjoiZW4ifQ.7_i1044OzC6OI03iuNTA7zIuP1GSvmra3IQ22etiSYI'
    var vidsData = parseVidsJwt(vids);
    if (!user) {
      fetch(`${BaseURL}/api/users/Alice`, { headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
      }})
      .then((res) => res.json())
      .then((user) => {
        console.log('jwt generated'); // user.username
        setUser(Object.assign({eventsId: uuidv4()}, user, vidsData));
      }).catch(console.error);
    }
  }, [])

  if (!user) {
    return (<>
    {/* <Stack
      direction="column"
      justifyContent="center"
      alignItems="center"
      sx={{p:4}}
      spacing={{ xs: 1, sm: 2, md: 4 }}
    >
      <Box sx={{ width: '27%' }}>
        <LoginBox onLogin={handleLogin} ></LoginBox>
      </Box>
    </Stack> */}
    </>);
  }
  else {
    return (<>
    <Box sx={{p:2, textAlign: 'center'}}>
      <Typography variant="h4" gutterBottom component="div">
        Premium TTS Demo
      </Typography>
      <Typography variant="subtitle1" component="div">
        <Typography variant="h6" component="span"> Type</Typography> in some text, 
        <Typography variant="h6" component="span"> Pick</Typography> a premium voice, 
        <Typography variant="h6" component="span"> Click</Typography> the button to make a TTS call to your phone number(or play it back from the browser).
        <br></br>
        Every call is recorded and the recording will be transcribed if you have picked the language en-US.<br></br>
      </Typography>
    </Box>
    <Stack
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start"
      sx={{p:2, m:2}}
      spacing={{ xs: 1, sm: 2, md: 4 }}
    >
      <Box 
        sx={{
          width: '25%', minWidth: '300'
        }}
      >
        <TextBox user={user}></TextBox>
      </Box>
      <Box sx={{ width: '75%', borderLeft: 1, borderColor: 'divider', pl:2 }}>
        <EventsBox user={user}></EventsBox></Box>
    </Stack>
    </>);
  }
}

export default App;
