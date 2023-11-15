
import { Stack, Box, Typography } from "@mui/material";
import TextBox from "../../components/TextBox.js";
import EventsBox from "../../components/EventsBox.js";

export function Home() {

  return (<>
    <Stack
      direction="column"
      justifyContent="flex-start"
      alignItems="center"
    >
      <Box><Typography variant="h4" component="span">{"Premium TTS Demo"}</Typography></Box>
      <Box>
        <Typography variant="h6" component="span">{"Type"}</Typography>{" in some text, "} 
        <Typography variant="h6" component="span">{"Pick"}</Typography>{" a premium voice, "}
        <Typography variant="h6" component="span">{"Click"}</Typography>{" the button to make a TTS call, or "}
        <Typography variant="h6" component="span">{"Play"}</Typography>{" it back from the browser "}
      </Box>
      <Box>
      <Typography variant="body1" component="span">
        {"The call will be recorded and transcribed. "}
        {/* {"Voice API sends the recording url and transcriptions to the event webhook endpoint."} */}
        {"For more about the call Transcription, see "} 
        <a 
          target="_blank" 
          href="https://developer.vonage.com/en/voice/voice-api/concepts/recording#transcription-beta" 
          rel="noreferrer"
          >{"Developer Doc"}</a>
      </Typography>
      </Box>
    </Stack>
    
    <Stack
      direction={{ xs: 'column', sm: 'row' }}
      spacing={{ xs: 1, sm: 2, md: 4 }}
      justifyContent="flex-start"
      alignItems="flex-start"
      sx={{ mt: 2}}
    >
      <Box sx={{ width: "26%", minWidth: "360px" }} >
        <TextBox />
      </Box>

      <Box sx={{ width: "74%", minWidth: "360px", pl: 1 }}>
        <EventsBox />
      </Box>
    </Stack>
  </>);
}