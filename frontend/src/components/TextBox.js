
import { useState, useEffect, useContext, useRef } from "react";
import { Stack, Button, TextField, Typography, MenuItem } from "@mui/material";
import { UserContext } from "../context/UserContext";
import languages from "../config/index.js";
import CallButtons from "./CallButtons.js";
import NexmoClient from "nexmo-client";

const APP_API_URL_CREATE_CALL = `${process.env.REACT_APP_URL || ""}/api/create-outbound-call`;
const REGION = process.env.REACT_APP_VONAGE_REGION || "us-3";
const PRICE_PER_UNIT = Number(process.env.REACT_APP_PRICE_PER_UNIT) || 0.0029;

export default function TextBox() {
  const { user } = useContext(UserContext);

  const rtc = useRef(null);

  const [rtcApp, setRtcApp] = useState(null);
  const [call, setCall] = useState(null);
  const [callStatus, setCallStatus] = useState("connecting");

  const [phone, setPhone] = useState(user?.phone || "");

  const [estimatedCost, setEstimatedCost] = useState(0);

  const [textErr, setTextErr] = useState(false);
  const [text, setText] = useState(
    "The Vonage Voice API is the easiest way to build high-quality voice applications in the Cloud. "
    + "With the Voice API, you can send text-to-speech messages in 40 languages with different genders and accents. "
    + "Do not forget to try out the premium versions.");

  // styles: [..., {gender:, name:, premium:, ssml:, style:0}, ...]
  const [styles, setStyles] = useState([]); 
  // {gender:, name:, premium:, ssml:, style:0}
 const [styleSelected, setStyleSelected] = useState(null);
  // eg. "en-GB"
  const [languageSelected, setLanguageSelected] = useState("en-US");

  const createSession = (jwt) => {
    rtc.current = new NexmoClient({ 
      // debug: true, 
      nexmo_api_url: `https://api-${REGION}.vonage.com`,
      url: `wss://ws-${REGION}.vonage.com`,
      ips_url: `https://api-${REGION}.vonage.com/v1/image`
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

  const createOutboundCall = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 4) {
      return;
    }
    try {
      e.target.disabled = true;

      const customData = {
        text: text,
        language: languageSelected,
        style: styleSelected.style,
        premium: styleSelected.premium === "true"? true : false, 
        record: true,
        userId: user.userId,
        to: phone,
      };
      console.log("=== customData", customData);
      
      fetch(APP_API_URL_CREATE_CALL, {
        method: "POST", 
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify(customData)
      }).then((res) => res.json()).then((data) => {
        console.log("fetched", APP_API_URL_CREATE_CALL, data);
      }).catch(console.error).finally(() => e.target.disabled = false );

    } catch (e) {
      console.log(e.message);
      e.target.disabled = false;
    }
  };

  const handleCall = (e) => {
    e.preventDefault();
    if (text.length < 1 || !rtcApp) {
      return;
    }
    try {
      const customData = {
        text: text,
        language: languageSelected,
        style: styleSelected.style,
        premium: styleSelected.premium === "true"? true : false, 
        record: true,
        userId: user.userId, 
      };
      console.log("=== customData", customData);
      
      setCallStatus("calling");

      rtcApp.callServer("", "phone", customData).then((nxmCall) => {
        // console.log("Call Object ", nxmCall);
      }).catch(console.error);
      
    } catch (error) {
      console.log(e.message);
    }
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

  // a maximum of 1500 characters (excluding SSML tags)
  const handleChangeText = (e) => {
    var _text = e.target.value.replace(/[\t]/g, " ");
    // console.log(_text.length, _text);
    var _textExcSSML = _text.replace(/<[^>]*>/g, "");
    // console.log(_textExcSSML.length, _textExcSSML);
    if (_textExcSSML.length > 1500 || _text.length < 1) {
      setTextErr(true);
    } else {
      setTextErr(false);
    }
    setText(_text);
  }

  const handleChangeLanguage = (e) => {
    // language["code"]:  e.target.value
    let _lang = languages.find(l => l.code === e.target.value);
    setLanguageSelected(_lang.code);
  }

  const handleChangeStyle = (e) => {
    // style["name"]:  e.target.value
    setStyleSelected(styles.find(s => s.name === e.target.value));
  }

  const getBrowserLanguage = () => {
    var browserLanguage; 
    try {
      if (navigator.languages && navigator.languages.length) {
        browserLanguage = navigator.languages.find(e => e.indexOf("-") >= 0);
      } else if (navigator.language) {
        browserLanguage = navigator.language;
      }
    } catch (error) {
    }
    // console.log({ browserLanguage });
    return browserLanguage || "en-US"; 
  }

  /**
   * including the SSML tags(except mark), newlines, and spaces,
   * */ 
  const calEstCost = () => {
    if (!styleSelected || styleSelected.premium !== "true") {
      return setEstimatedCost(Number(0).toFixed(4));
    }

    const _text = text.replace(/<mark.*?\/>/ig, "");
    const characterCount = _text.length;
    // console.log(_text.length, _text);

    const units = characterCount >= 100 
      ? Math.ceil(characterCount / 100) 
      : characterCount < 1 ? 0 : 1;

    const totalPrice = units * PRICE_PER_UNIT;

    setEstimatedCost(totalPrice.toFixed(4))
  }

  useEffect(() => {
    if (user && user.jwt && rtc.current === null)  {
      createSession(user.jwt);
    }
  }, [user]);

  useEffect(() => {
    if (languages && languages.length) {
      const browserLanguage = getBrowserLanguage();
      const _lang = languages.find(l => l.code == browserLanguage);
      if (_lang) setLanguageSelected(_lang.code);
    }
  }, []);

  useEffect(() => {
    if (languageSelected) {
      const _lang = languages.find(l => l.code == languageSelected);
      setStyles(_lang.styles || []);
      setStyleSelected(_lang.styles.length? (_lang.styles.find(s => s.premium === "true") || _lang.styles[0]) : null);
    }
  }, [languageSelected]);

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
  }, [text, languageSelected, styleSelected, styles]);

return (<>
    <Stack 
      spacing={4}
      direction="column"
      justifyContent="center"
      alignItems="stretch"
      component="form"
      sx={{ pb:2, textAlign: "left" }}
    >
      <TextField
        error={phone.length < 4 || phone.length > 16}
        id="phone"
        label="Your Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
      ></TextField>
      <TextField
        error={textErr}
        id="text"
        label="TTS Message"
        multiline
        rows={7}
        value={text}
        onChange={handleChangeText}
        helperText={<>
          {"* $0.0029 per 100 characters for Premium Voices"}
          <Typography gutterBottom variant="caption" display="block" color={"blue"} sx={{ width: "100%", textAlign: "right"}} spacing={0}>
          {"(TTS) Est. Cost: $" + estimatedCost + ""}
          </Typography>
        </>}
      ></TextField>
      <TextField
        select
        required
        id="language-select"
        label="Language"
        helperText="* Only those that have a premium voice are available for the demo"
        value={languageSelected}
        onChange={handleChangeLanguage}
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
        id="style-select"
        label="Language Style"
        value={styleSelected?.name || ""}
        onChange={handleChangeStyle}
      >
        {styles.map((s, i) => (
          <MenuItem key={i} value={s.name}>
             <Typography variant="body1" display="span">
                {s.style}
                <Typography variant="caption" display="span">
                  {` ${s.gender} `} 
                </Typography>
                {s.premium === "true" ? "Premium" : ""}
                <Typography variant="caption" display="span">
                  {s.ssml === "false" ? "(ssml not supported)" : ""} 
                </Typography>
            </Typography>
          </MenuItem>
        ))}
      </TextField>

      <Stack 
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        spacing={0}
      >
        <Button variant="contained" onClick={createOutboundCall} >
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
