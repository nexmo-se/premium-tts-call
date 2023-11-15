
import { useState, useEffect, useContext, useRef } from "react";
import { Stack, Button, TextField, Typography, MenuItem } from "@mui/material";
import { UserContext } from "../context/UserContext";
import languagesConfig from "../config/languages.js";
import CallButtons from "./CallButtons.js";
import NexmoClient from "nexmo-client";

const APP_URL = process.env.REACT_APP_URL || "";
const REGION = process.env.REACT_APP_VONAGE_REGION || "us-1";
const PRICE_PER_UNIT = Number(process.env.REACT_APP_PRICE_PER_UNIT) || 0.0029;

export default function TextBox() {
  const { user } = useContext(UserContext);

  const rtc = useRef(null);

  const [rtcApp, setRtcApp] = useState(null);
  const [call, setCall] = useState(null);
  const [callStatus, setCallStatus] = useState("connecting");

  const [phone, setPhone] = useState(user?.phone || "");

  const [text, setText] = useState(
    "The Vonage Voice API is the easiest way to build high-quality voice applications in the Cloud. "
    + "With the Voice API, you can send text-to-speech messages in 40 languages with different genders and accents. "
    + "Do not forget to try out the premium versions.");
  const [estimatedCost, setEstimatedCost] = useState(0);

  const [languages, setLanguages] = useState([]);
  const [language, setLanguage] = useState(""); // eg. "en-GB"
  const [styles, setStyles] = useState([]);
  const [voiceName, setVoiceName] = useState(""); // eg. "en-GB-Wavenet-A", "Amy"
  
  const createSession = (jwt) => {
    rtc.current = new NexmoClient({ 
      // debug: true, 
      nexmo_api_url: `https://api-${REGION}.nexmo.com`,
      url: `wss://ws-${REGION}.nexmo.com`,
      ips_url: `https://api-${REGION}.nexmo.com/v1/image`
    });

    rtc.current.createSession(jwt).then(rtcApp => {
      console.log(rtcApp.session?.session_id || "no session_id");
      setRtcApp(rtcApp);
      setCallStatus("ready");
    }).catch((e) => {
      console.error(e);
      rtc.current = false;
    });
  };

  const createCall = (e) => {
    e.preventDefault();
    let selected = styles.find(i => i.name === voiceName);
    if (!selected || !phone || phone.length < 4) {
      return;
    }
    e.target.disabled = true;
    const customData = {
      text: text,
      language: language,
      style: selected.style,
      premium: selected.premium === "true"? true : false, 
      record: true,
      userid: user.userid,
      from: user.lvn || "",
      to: phone
    };
    console.log("=== customData", customData);
    fetch(`${APP_URL}/api/create-call`, { method: "POST", headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(customData)})
      .then((res) => res.json())
      .then((data) => {
        console.log(data);
      }).catch(console.error).finally(() => e.target.disabled = false );
  };

  const handleCall = (e) => {
    let selected = styles.find(i => i.name === voiceName);
    if (!selected || text.length < 1 || !rtcApp) {
      return;
    }
    const customData = {
      text: text,
      language: language,
      style: selected.style,
      premium: selected.premium === "true"? true : false, 
      record: true,
      userid: user.userid
    };
    console.log("=== customData", customData);
    setCallStatus("calling");
    rtcApp.callServer(user.lvn || "", "phone", customData).catch(console.error);
  };
  
  const handleHangUp = (e) => {
    try {
      setCallStatus("ending");
      call && call.hangUp().catch(console.error);
    } catch(e) {
      console.error(e);
    } finally {
      setCall(null);
    };
  };

  const calEstCost = () => {
    const cleanText = text.replace(/<mark.*?\/>/ig, "");
    const characterCount = cleanText.length;
    console.log(cleanText.length, cleanText)
    const units = characterCount >= 100 
      ? Math.ceil(characterCount / 100) 
      : characterCount < 1 ? 0 : 1;
    const totalPrice = units * PRICE_PER_UNIT;
    setEstimatedCost( totalPrice.toFixed(4) )
  }

  const handleChangeText = (e) => {
    var cleanText = e.target.value.replace(/[\t\n]/g, "");
    var cleanTextExcSSML = cleanText.replace(/<[^>]*>/g, "");
    console.log(cleanTextExcSSML.length, cleanTextExcSSML)
    console.log(cleanText.length, cleanText)
    if (cleanTextExcSSML.length > 1500) return;
    setText(cleanText)
  }

  useEffect(() => {
    if (user && user.jwt && rtc.current === null) {
      createSession(user.jwt);
    }
  }, [user]);

  useEffect(() => {
    const languages = languagesConfig.filter(lang => lang.styles.find(style => style.premium === "true"));
    setLanguages(languages);
  }, []);

  useEffect(() => {
    if (languages && languages.length) {
      const findLang = (code) => {
        var langCode = code? code : null;
        // default
        if (!langCode) {
          var locale = 
            navigator.languages && navigator.languages.length
              ? navigator.languages.find(e => e.indexOf("-") >= 0)
              : null;
          locale = locale? locale : navigator.language;
          // console.log("default language", locale);
          langCode = locale && locale.indexOf("-") >= 0? locale : null;
        }
        //
        var language = languages.find(i => i.code === langCode);
        if (!language) {
          langCode = "en-US"; 
          language = languages.find(i => i.code === langCode); 
        }
        return language;
      };
      var lang = findLang();
      // select a voice name
      let selected = lang.styles.find(i => i.premium === "true");
      selected = selected ? selected : lang.styles[0];
      setLanguage(lang.code);
      setStyles(lang.styles);
      setVoiceName(selected.name);
    }
  }, [languages]);

  useEffect(() => {
    if (rtcApp) {
      rtcApp.on("member:call", (member, nxmCall) => {
        console.log("=== member:call", nxmCall.status, member.callStatus, nxmCall?.conversation?.id || "");
        setCall(nxmCall);
      });
      rtcApp.on("call:status:changed",(nxmCall) => {
        console.log("=== call:status:changed", `Call status: ${nxmCall.status}`);
        setCallStatus(nxmCall.status);
      });
    }
  }, [rtcApp]);

  useEffect(() => {
    calEstCost();
  }, [text]);

  useEffect(() => {
    return () => {
      if (rtc.current) {
        rtc.current.deleteSession();
      }
    };
  }, []);

return (<>
    <Stack 
      spacing={3}
      direction="column"
      justifyContent="center"
      alignItems="stretch"
      component="form"
      sx={{ pb:2, textAlign: "left" }}
    >
      <TextField
        error={phone.length < 4? true : false}
        id="phone"
        label="Your Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      ></TextField>
      <TextField
        error={text.length < 1 ? true : false }
        id="text"
        label="TTS Message"
        multiline
        rows={7}
        value={text}
        onChange={handleChangeText}
        helperText={<>
        {"Est. Cost: $" + estimatedCost}
        <br />{"* $0.0029 per 100 characters"}
        {/* <br />{"* All characters counted including white space and all SSML tags except <mark>"} */}
        </>}
      ></TextField>
      <TextField
        select
        required
        id="language"
        label="Language"
        helperText="* Only those that have a premium voice are available for the demo"
        value={language}
        onChange={e => {
          let lang = languages.find(i => i.code === e.target.value);
          setLanguage(lang.code);
          setStyles(lang.styles);
          // select a voice name
          let selected = lang.styles.find(i => i.premium === "true");
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
            {e.style} ({e.gender}) {e.premium === "true" ? "Premium" : ""} 
          </MenuItem>
        ))}
      </TextField>
      <Stack 
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        spacing={0}
      >
        <Button variant="contained" onClick={createCall} >
          {"make a TTS call to your number"}
        </Button>

        <Typography gutterBottom component="div" sx={{color:"gray", textAlign: "center", p:2}}>
        {"--- OR ---"}
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
