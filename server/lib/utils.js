
const APP_PUBLIC_URL = process.env.VCR_INSTANCE_PUBLIC_URL;

const buildNcco = function(payload) {
  var ncco = [{
    action: "talk",
    text: payload.text,
    language: payload.language,
    style: payload.style,
    premium: payload.premium,
  }];
  if (payload.record) {
    var _ncco = {
      action: "record",
      eventUrl: [ `${APP_PUBLIC_URL}/webhooks/event`],
      format: "wav",
      beepStart: true
    };
    switch(payload.language){
    // ar Arabic 
    case "ar": 
      _ncco.transcription = { language: "ar-SA" };
      break;
      // cmn-CN Chinese, Mandarin (China) 
    case "cmn-CN": 
      _ncco.transcription = { language: "zh" };
      break;
      // cmn-TW Chinese, Mandarin (Taiwan) 
    case "cmn-TW": 
      _ncco.transcription = { language: "zh-TW" };
      break;
      // cy-GB Welsh 
    case "cy-GB": 
      // _ncco.transcription = { language: "" };
      break;
      // // en-GB-SCT English (Scotland) 
      // case "en-GB-SCT": 
      //   _ncco.transcription = { language: "" };
      //   break;
      // en-GB-WLS English (Wales) 
    case "en-GB-WLS": 
      // _ncco.transcription = { language: "" };
      break;
      // no-NO Norwegian 
    case "no-NO": 
      _ncco.transcription = { language: "nb-NO" };
      break;
      // pa-IN Punjabi 
    case "pa-IN": 
      _ncco.transcription = { language: "pa-guru-IN" };
      break;
      // yue-CN Chinese, Cantonese (China) 
    case "yue-CN": 
      _ncco.transcription = { language: "yue-hant-HK" };
      break;
    default:
      _ncco.transcription = { language: payload.language };
      break;
    }
    ncco.unshift(_ncco);
  }
  return ncco;
};

module.exports = {
  buildNcco,
};

