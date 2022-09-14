import * as React from 'react';
import { useState, useEffect } from "react";
import { Stack, Button } from '@mui/material';
import { v4 as uuidv4 } from 'uuid';

const AppServerUrl = process.env.REACT_APP_SERVER || '';

export default function LoginBox(props) {
  const [username, setUsername] = useState('Alice');
  const handleSubmit = function(e) {
      e.preventDefault();
      fetch(`${AppServerUrl}/api/users/${username}`, { headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }})
      .then((res) => res.json())
      .then((user) => {
        console.log('jwt generated for', user.username)
        props.onLogin({ uuid: uuidv4(), ...{user} });
      }).catch(console.error);
  }

  useEffect(() => {
    fetch(`${AppServerUrl}/api/users`, { headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
      }})
    .then((res) => res.json())
    .then().catch(console.error);
  }, []);

  return (<>
    <Stack 
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        spacing={{ xs: 1, sm: 2, md: 4 }}
        component="form"
        autoComplete="off"
        noValidate
        onSubmit={handleSubmit}
    >
      {/* <TextField
        disabled
        required
        id="username"
        label="Your Username"
        value={username}
        onChange={e => setUsername(e.target.value)}
      /> */}
      
      <Button type="submit"
          variant="outlined"
      >
        Start
      </Button>
    </Stack>
  </>);
}
