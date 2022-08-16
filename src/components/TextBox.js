import * as React from 'react';
import { useState, useEffect, useCallback } from "react";
import {Stack, Button, TextField, Typography, MenuItem} from '@mui/material';
import NexmoClient from 'nexmo-client';
import CallButtons from './CallButtons.js'
import languages from "../config/languages.js";

const BaseURL = process.env.PUBLIC_URL? process.env.PUBLIC_URL : 'http://localhost:3002';

// NexmoClient
const NXM = new NexmoClient({ 
  debug: false, 
  nexmo_api_url: "https://api-us-1.nexmo.com",
  url: "wss://ws-us-1.nexmo.com",
  ips_url: "https://api-us-1.nexmo.com/v1/image"
 });

export default function TextBox(props) {
  const { user } = props;

  const [rtcApp, setRtcApp] = useState(null);
  const [call, setCall] = useState(null);
  const [callStatus, setCallStatus] = useState('connecting');
  
  const [phone, setPhone] = useState(user.phone? user.phone : '');
  const [lvn, setLvn] = useState('442382148031');
  const [text, setText] = useState(
    'The Vonage Voice API is the easiest way to build high-quality voice applications in the Cloud. '
    + 'With the Voice API, you can send text-to-speech messages in 40 languages with different genders and accents. '
    + 'Don\'t forget to try out the premium versions.');
  
  const userLocale = 
    navigator.languages && navigator.languages.length
      ? navigator.languages[0]
      : navigator.language;

  const [language, setLanguage] = useState(userLocale);
  const [styles, setStyles] = useState([]);
  const [style, setStyle] = useState('');
  const [premium, setPremium] = useState(false);

  const createSession = useCallback(() => {
    if (user) {
      NXM.createSession(user.jwt).then(rtcApp => {
        setRtcApp(rtcApp);
        setCallStatus('ready');
      })
      .catch(console.error);
    }
  }, [user]);

  const handleCall = (e) => {
    let s = styles.find(i => i.name == style);
    if (!s) return alert('Please select a valid style');
    const customData = {
      text: text,
      language: language,
      style: s.style,
      premium: premium, 
      record: true,
      events_id: user.eventsId
    }
    console.log('=== customData', customData);
    //return;
    if (text.length <= 0 || !rtcApp) {
      console.log('=== rtcApp')
      return;
    }
    setCallStatus('calling');
    rtcApp.callServer(lvn, "phone", customData).catch(console.error);
  };
  
  const handleHangUp = (e) => {
    setCallStatus('ending');
    try {
      call && call.hangUp().catch(console.error);
    } catch(e) {
      console.error(e);
    } finally {
      setCall(null);
    };
  };

  const createCall = (e) => {
    e.preventDefault();
    e.target.disabled = true;
    let s = styles.find(i => i.name == style);
    if (!s) return alert('Please select a valid style');
    const customData = {
      text: text,
      language: language,
      style: s.style,
      premium: premium, 
      record: true,
      events_id: user.eventsId,
      from: lvn,
      to: phone
    }
    console.log('=== customData', customData);
    fetch(`${BaseURL}/api/create-call`, { method: 'POST', headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customData)})
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      }).catch(console.error).finally(() => e.target.disabled = false );
  }

  useEffect(() => {
    //console.log(user)
    if (languages) {
      let l = languages.find(i => i.code === language);
      setStyles(l.styles);
      setStyle(l.styles[0].name);
      setPremium(l.styles[0].premium === 'true' ? true : false);
    }
  }, []);

  useEffect(() => {
    createSession();
  }, [createSession]);

  useEffect(() => {
    if (rtcApp) {
      rtcApp.on("member:call", (member, nxmCall) => {
        console.log('=== member:call', nxmCall.status, member.callStatus, nxmCall.conversation.id);
        setCall(nxmCall);
      })
      rtcApp.on("call:status:changed",(nxmCall) => {
        console.log('=== call:status:changed', `Call status: ${nxmCall.status}`);
        setCallStatus(nxmCall.status);
      });
    }
  }, [rtcApp]);

  return (<>
    <Stack 
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        sx={{pb:2}}
        spacing={{ xs: 1, sm: 2, md: 4 }}
    >

      {/* <TextField
        required
        disabled
        id="lvn"
        label="Vonage Virtual Number"
        value={lvn}
        onChange={e => setLvn(e.target.value)}
      ></TextField> */}
      <TextField
        id="number"
        label="Your Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      ></TextField>
      <TextField
        id="text"
        label="TTS Message"
        multiline
        rows={7}
        value={text}
        onChange={e => setText(e.target.value)}
      ></TextField>
      <TextField
        select
        required
        id="language"
        label="Language"
        value={language}
        onChange={e => {
          let l = languages.find(i => i.code === e.target.value);
          setLanguage(e.target.value);
          setStyles(l.styles);
          setStyle(l.styles[0].name);
        }}
      >
        {languages.map((e, i) => (
          <MenuItem key={i} value={e.code}>
            {e.language}
          </MenuItem>
        ))}
      </TextField>
      <TextField
        select
        required
        id="style"
        label="Language Style"
        value={style}
        onChange={e => {
          let s = styles.find(i => i.name == e.target.value);
          setStyle(s.name);
          setPremium(s.premium === 'true' ? true : false)
        }}
      >
        {styles.map((e, i) => (
          <MenuItem key={i} value={e.name}>
            {e.style} ({e.gender}) {e.premium === 'true' ? 'Premium' : ''} 
          </MenuItem>
        ))}
      </TextField>

      <Stack 
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        spacing={0}
      >
        <Button variant='contained' onClick={createCall} >
          {'make a TTS call to your number'}
        </Button>

        <Typography gutterBottom component="div" sx={{color:'gray', textAlign: 'center', p:2}}>
        --- OR ---
        </Typography>

        <CallButtons 
          callStatus={callStatus}
          onCall={handleCall}
          onHangUp={handleHangUp}
        />
      </Stack>
    </Stack>
  </>);
}
