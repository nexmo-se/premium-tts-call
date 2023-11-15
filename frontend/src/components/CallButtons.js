import { useState, useEffect } from "react";
import { Stack, Button, Typography } from "@mui/material";

export default function CallButtons({ callStatus, onHangUp, onCall }) {
  
  const [state, setState] = useState({
    disabled: true,
    variant: "outlined",
    color: "error",
    onClick: null,
    label: ""
  });

  useEffect(() => {
    switch (callStatus) {
    case "connecting":
    case "calling":
    case "ending":
      setState(prev => {
        return {...prev, ...{ 
          disabled: true,
          label: callStatus + " ... "
        }};
      });
      break;
    case "started":
    case "ringing":
    case "answered":
    case "failed":
      setState(prev => {
        return {...prev, ...{
          disabled: false,
          variant: "outlined",
          color: "error",
          onClick: onHangUp,
          label: "Hang Up"
        }};
      });
      break;
    default:
      setState(prev => {
        return {...prev, ...{
          disabled: false,
          variant: "contained",
          color: "success",
          onClick: onCall,
          label: "play it back from the browser"
        }};
      });
      break;
    }
  }, [callStatus, onHangUp, onCall]);

  return (
    <Stack 
      direction="column"
      justifyContent="center"
      alignItems="stretch"
      spacing={0}
    >
      <Button 
        disabled={state.disabled} 
        variant={state.variant} 
        color={state.color} 
        onClick={state.onClick} 
      >
        {state.label}
      </Button>
      <Typography gutterBottom component="div" sx={{color:"gray", m:0, p:0}}>
      This creates an in-app call
      </Typography>
    </Stack>
  );
}
