
import { useState, useEffect, useContext, useRef } from "react";
import { Stack, Box } from "@mui/material";
import { UserContext } from "../context/UserContext";
import EventsTable from "./EventsTable.js";

const APP_URL = process.env.REACT_APP_URL || "";
const APP_URL_REALTIME = `${APP_URL}/api/realtime`;
const APP_UR_RECORDINGS = `${APP_URL}/api/recordings`;

export default function EventsBox() {
  const { user } = useContext(UserContext);

  const realtime = useRef(null);

  //const [sse, setSse] = useState("idle");
  const [events, setEvents] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [recordings, setRecordings] = useState([]);

  const updateEvents = (str) => {
    const data = JSON.parse(str);
    //console.log('updateEvents', data);
    if (data.type === "answer") {
      setAnswers(prev => [data, ...prev]);
    } 
    else if (data.type === "recording") {
      setRecordings(prev => {
        var found = prev.find(e => e.recording_uuid === data.recording_uuid);
        if (!found) return [data, ...prev];
        else return [
          {
            ...found, 
            file_uuid: data.file_uuid
          },
          ...prev.filter(e => e.recording_uuid !== data.recording_uuid)
        ];
      });
      data.info = "(Recording Available)";
      setEvents(prev => [data, ...prev]);
    }
    else if (data.type === "transcription") {
      //console.log('updateEvents', data.transcript)
      setRecordings(prev => {
        var found = prev.find(e => e.recording_uuid === data.recording_uuid);
        if (!found) return [data, ...prev];
        else return [
          {...found, transcript: data.transcript},
          ...prev.filter(e => e.recording_uuid !== data.recording_uuid)
        ];
      });
      setEvents(prev => [data, ...prev]);
    } else {
      setEvents(prev => [data, ...prev]);
    }
  };

  useEffect(() => {
    if (user && user.userid && realtime.current === null) {
      try {
        realtime.current = new EventSource(`${APP_URL_REALTIME}/${user.userid}`);
  
        realtime.current.onmessage = ({ data }) =>  {
          updateEvents(data);
        };
  
        realtime.current.onerror = (event) => {
          realtime.current.close();
        };
      } catch (error) {
        console.log(error.message);
        realtime.current = false;
      }
    }
  }, [ user ]);

  useEffect(() => {
    return () => {
      if (realtime.current) {
        realtime.current.close();
      }
    };
  }, []);

  return (<>
    <Stack 
      direction="column"
      justifyContent="center"
      alignItems="stretch"
      spacing={{ xs: 1, sm: 2, md: 4 }}
    >
      <Box sx={{
        pt:2,
        borderTop: 1, 
        borderColor: "divider" }}>
        <EventsTable key='2'
          name="recordings"
          rows={recordings} 
          columns={[
            { id: "conversation_uuid", label: "Conversation UUID", minWidth: 200,
              format: (value) => <Box textAlign="left" >{value}<br />
                <a key={"btn-" + value} target='_blank'
                  href={"https://tools.vonage.com/voice/inspector/?searchTab=2&conversationId=" + value}
                >
                {"Voice Inspector"}
                </a>
              </Box>
            },
            //{ id: 'recording_uuid', label: 'Recording UUID', minWidth: 100 },
            { id: "file_uuid", label: "Recording", minWidth: 100, 
              format: (value) => <audio controls key={"audio-" + value} >
                <source src={`${APP_UR_RECORDINGS}/${value}`} type="audio/wav"></source>
              </audio>
            },
            { id: "transcript", label: "Transcript", minWidth: 100},
          ]} 
        />
      </Box>
      <Box sx={{
        pt:2,
        borderTop: 1, 
        borderColor: "divider"}}>
        <EventsTable key='0'
          name="events"
          rows={events} 
          columns={[
            { id: "conversation_uuid", label: "Conversation UUID", minWidth: 200 },
            //{ id: 'uuid', label: 'UUID', minWidth: 100 },
            { id: "status", label: "STATUS", minWidth: 100 },
            { 
              id: "timestamp", label: "TIME", minWidth: 100,
              format: (value) => value && (new Date(value)).toISOString(),
            },
            { id: "info", label: "", minWidth: 100 },
          //', label: 'TO',  minWidth: 100}
          ]} 
        />
      </Box>
      <Box sx={{
        pt:2,
        borderTop: 1, 
        borderColor: "divider"}}>
        <EventsTable key='1'
          name="answers"
          rows={answers} 
          columns={[
            { id: "conversation_uuid", label: "Conversation UUID", minWidth: 200, 
              format: (value) => <Box textAlign="left" >{value}<br />
                <a key={"btn-" + value} target='_blank'
                  href={"https://tools.vonage.com/voice/inspector/?searchTab=2&conversationId=" + value}
                >
                {"Voice Inspector"}
                </a>
              </Box>
            },
            //{ id: 'uuid', label: 'UUID', minWidth: 100 },
            { id: "ncco", label: "NCCO", minWidth: 100, 
              format: (value) => <Box component="pre">{JSON.stringify(value, null, 2)}</Box>
            },
          //{ id: 'from_user', label: 'From', minWidth: 100 }
          ]} 
        />
      </Box>
    </Stack>
  </>);
}
