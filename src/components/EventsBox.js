import * as React from 'react';
import { useState, useEffect } from "react";
import { Stack, Typography, Box, Button } from '@mui/material';
import EventsTable from './EventsTable.js';

const BaseURL = process.env.PUBLIC_URL? process.env.PUBLIC_URL : 'http://localhost:3002';

export default function EventsBox(props) {
  const { user } = props;
  //const [sse, setSse] = useState("idle");
  const [events, setEvents] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [recordings, setRecordings] = useState([]);

  const updateEvents = (str) => {
    const data = JSON.parse(str);
    //console.log('updateEvents', data);
    if (data.type === 'answer') {
      setAnswers(prev => [data, ...prev])
    } 
    else if (data.type === 'recording') {
      setRecordings(prev => {
        var found = prev.find(e => e.recording_uuid === data.recording_uuid);
        if (!found) return [data, ...prev];
        else return [
          {...found, filename: data.filename},
          ...prev.filter(e => e.recording_uuid !== data.recording_uuid)
        ];
      });
    }
    else if (data.type === 'transcription') {
      //console.log('updateEvents', data.transcript)
      setRecordings(prev => {
        var found = prev.find(e => e.recording_uuid === data.recording_uuid);
        if (!found) return [data, ...prev];
        else return [
          {...found, transcript: data.transcript},
          ...prev.filter(e => e.recording_uuid !== data.recording_uuid)
        ];
      })
    } else {
      setEvents(prev => [data, ...prev]);
    }
  };

  useEffect(() => {
    if (user && user.eventsId) {
      console.log('user.eventsId', [user.eventsId, user.phone, user.firstname])
      const eventSource = new EventSource(`${BaseURL}/api/events/realtime/${user.eventsId}`);
      eventSource.onmessage = ({ data }) =>  {
        updateEvents(data);
      };
      eventSource.onerror = (event) => {
        eventSource.close()
      };
      return () => {
        eventSource.close();
      };
    }
  }, []);

  return (<>
    <Stack 
        direction="column"
        justifyContent="center"
        alignItems="stretch"
        spacing={{ xs: 1, sm: 2, md: 4 }}
    >
      <Box sx={{ }}>
      <Typography variant="subtitle1" component="div" sx={{pb:1}} > Recordings </Typography>
      <EventsTable key='2'
        name="recordings"
        rows={recordings} 
        columns={[
          { id: 'conversation_uuid', label: 'Conversation UUID', minWidth: 200,
            format: (value) => <Box textAlign="left" >{value}<br />
              <Button key={'btn-' + value} target='_blank'
                href={"https://tools.vonage.com/voice/inspector/?searchTab=2&conversationId=" + value}
              >
                Voice Inspector
              </Button>
            </Box>
          },
          //{ id: 'recording_uuid', label: 'Recording UUID', minWidth: 100 },
          { id: 'filename', label: 'Recording', minWidth: 100, 
            format: (value) => <audio controls key={'audio-' + value} >
              <source src={`${BaseURL}/${value}`} type="audio/wav"></source>
            </audio>
          },
          { id: 'transcript', label: 'Transcript (en-US only)', minWidth: 100},
        ]} 
      />
      </Box>
      <Box sx={{
          pt:2,
          borderTop: 1, 
          borderColor: 'divider'}}>
      <Typography variant="subtitle1" component="div" sx={{pb:1}} > Events </Typography>
      <EventsTable key='0'
        name="events"
        rows={events} 
        columns={[
          { id: 'conversation_uuid', label: 'Conversation UUID', minWidth: 200 },
          //{ id: 'uuid', label: 'UUID', minWidth: 100 },
          { id: 'status', label: 'STATUS', minWidth: 100 },
          { 
            id: 'timestamp', label: 'TIME', minWidth: 100,
            format: (value) => value && (new Date(value)).toISOString(),
          },
          //', label: 'TO',  minWidth: 100}
        ]} 
      />
      </Box>
      <Box sx={{
          pt:2,
          borderTop: 1, 
          borderColor: 'divider'}}>
      <Typography variant="subtitle1" component="div" sx={{pb:1}} > NCCO </Typography>
      <EventsTable key='1'
        name="answers"
        rows={answers} 
        columns={[
          { id: 'conversation_uuid', label: 'Conversation UUID', minWidth: 200, 
            format: (value) => <Box textAlign="left" >{value}<br />
              <Button key={'btn-' + value} target='_blank'
                href={"https://tools.vonage.com/voice/inspector/?searchTab=2&conversationId=" + value}
              >
                Voice Inspector
              </Button>
            </Box>
         },
          //{ id: 'uuid', label: 'UUID', minWidth: 100 },
          { id: 'ncco', label: 'NCCO', minWidth: 100, 
            format: (value) => <Box component="pre">{JSON.stringify(value, null, 2)}</Box>
          },
          //{ id: 'from_user', label: 'From', minWidth: 100 }
        ]} 
      />
      </Box>
    </Stack>
  </>);
}
