// languages.json is a copy of https://raw.githubusercontent.com/nexmo-community/vapi-tts-voices/main/voices.json
import data from "./languages.json";

var languages = data;

// only those languages that have a premium voice
if (process.env.REACT_APP_TTS_VOICES_FILTER === "premium-only") {
  languages = data.filter(l => l.styles.find(s => s.premium === "true"));
}

export default languages;
