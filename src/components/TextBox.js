import * as React from 'react';
import { useState, useEffect, useCallback } from "react";
import {Stack, Button, TextField, Typography, MenuItem } from '@mui/material';
import NexmoClient from 'nexmo-client';
import CallButtons from './CallButtons.js'
//import languages from "../config/languages.js";

const AppServerUrl = process.env.REACT_APP_SERVER || '';
const LVN          = process.env.REACT_APP_LVN;
console.log('LVN', LVN)

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
  const [lvn, setLvn] = useState(LVN);
  const [text, setText] = useState(
    'The Vonage Voice API is the easiest way to build high-quality voice applications in the Cloud. '
    + 'With the Voice API, you can send text-to-speech messages in 40 languages with different genders and accents. '
    + 'Don\'t forget to try out the premium versions.');

  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(''); // eg. "en-GB"
  const [styles, setStyles] = useState([]);
  const [voiceName, setVoiceName] = useState(''); // eg. "en-GB-Wavenet-A", "Amy"

  const createSession = useCallback(() => {
    if (user) {
      NXM.createSession(user.jwt).then(rtcApp => {
        setRtcApp(rtcApp);
        setCallStatus('ready');
      })
      .catch(console.error);
    }
  }, [user]);

  const createCall = (e) => {
    e.preventDefault();
    let selected = styles.find(i => i.name === voiceName);
    if (!selected || !phone || phone.length <= 0) {
      return;
    }
    e.target.disabled = true;
    const customData = {
      text: text,
      language: language,
      style: selected.style,
      premium: selected.premium === 'true'? true : false, 
      record: true,
      events_id: user.eventsId,
      from: lvn,
      to: phone
    }
    console.log('=== customData', customData);
    fetch(`${AppServerUrl}/api/create-call`, { method: 'POST', headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customData)})
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      }).catch(console.error).finally(() => e.target.disabled = false );
  }

  const handleCall = (e) => {
    let selected = styles.find(i => i.name === voiceName);
    if (!selected || text.length <= 0 || !rtcApp) {
      return;
    }
    const customData = {
      text: text,
      language: language,
      style: selected.style,
      premium: selected.premium === 'true'? true : false, 
      record: true,
      events_id: user.eventsId
    }
    console.log('=== customData', customData);
    setCallStatus('calling');
    rtcApp.callServer(lvn, "phone", customData).catch(console.error);
  };
  
  const handleHangUp = (e) => {
    try {
      setCallStatus('ending');
      call && call.hangUp().catch(console.error);
    } catch(e) {
      console.error(e);
    } finally {
      setCall(null);
    };
  };

  const findLang = (code) => {
    var langCode = code? code : null;
    // default
    if (!langCode) {
      var locale = 
        navigator.languages && navigator.languages.length
          ? navigator.languages.find(e => e.indexOf('-') >= 0)
          : null;
      locale = locale? locale : navigator.language;
      console.log('default language', locale);
      langCode = locale && locale.indexOf('-') >= 0? locale : null;
    }
    //
    var language = languages.find(i => i.code === langCode);
    if (!language) {
      langCode = 'en-US'; 
      language = languages.find(i => i.code === langCode); 
    }
    return language;
  }

  useEffect(() => {
    fetch(`${process.env.REACT_APP_TTS_VOICES_LIST}`, 
    { headers: { "User-Agent": "Fetcher" } })
    .then((res) => res.json())
    .then((data) => {
      //console.log(data)
      let languages = data.filter(lang => lang.styles.find(style => style.premium === 'true'))
      //console.log(languages)
      setLanguages(languages)
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (languages && languages.length) {
      var lang = findLang();
      // select a voice name
      let selected = lang.styles.find(i => i.premium === 'true');
      selected = selected ? selected : lang.styles[0];
      setLanguage(lang.code);
      setStyles(lang.styles);
      setVoiceName(selected.name);
    }
  }, [languages]);

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
        component="form"
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
        error={phone.length === 0 ? true : false}
        id="phone"
        label="Your Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      ></TextField>
      <TextField
        error={text.length === 0 ? true : false }
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
        helperText="*only those that have a premium voice are available for the demo"
        value={language}
        onChange={e => {
          let lang = languages.find(i => i.code === e.target.value);
          setLanguage(lang.code);
          setStyles(lang.styles);
          // select a voice name
          let selected = lang.styles.find(i => i.premium === 'true');
          selected = selected ? selected : lang.styles[0];
          setVoiceName(selected.name);
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
        value={voiceName}
        onChange={e => {
          let selected = styles.find(i => i.name === e.target.value);
          setVoiceName(selected.name);
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
