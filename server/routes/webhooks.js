
const { neru, Voice } = require("neru-alpha");
const { buildNcco } = require("../lib/utils");
const express = require("express");
const router = express.Router();

const Router = (services) => {
  const { store } = services;

  const handleVapiAnswer = async (req, res, next) => {
    try {
      console.log("[handleVapiAnswer]", JSON.stringify(req.body));

      const customData = req.body.custom_data? JSON.parse(req.body.custom_data) : {};
      const payload = Object.assign({}, customData, req.body);

      const ncco = buildNcco(payload);

      if (payload.conversation_uuid && payload.userid) {
        await store.set(payload.conversation_uuid, payload.userid);

        req.app.emit(`inform-client-${payload.userid}`, { 
          type: "answer", 
          ncco: ncco, 
          conversation_uuid: payload.conversation_uuid
        });
      }
      
      return res.json(ncco);
    } catch (e) {
      console.log(e.message);
      next(e);
    }
  };

  const handleVapiEvent = async (req, res, next) => {
    try {
      console.log("[handleVapiEvent]", JSON.stringify(req.body));

      const payload = req.body;

      if (!payload.conversation_uuid) {
        return res.sendStatus(200);
      }

      const userid = await store.get(payload.conversation_uuid);
      if (!userid) return res.sendStatus(200);

      if (payload.recording_url) {
        req.app.emit("vapi-recording-available", {...payload, userid});
      }
      else if (payload.transcription_url) {
        req.app.emit("vapi-transcription-available", {...payload, userid});
      }
      else {
        req.app.emit(`inform-client-${userid}`, {
          ...payload,
          userid,
          type: "event"
        });
      }

      return res.sendStatus(200);
    } catch (e) {
      console.log(e.message);
      next(e);
    }
  };

  router.post("/answer", handleVapiAnswer);
  router.post("/event", handleVapiEvent);

  router.post("/onAnswer", async (req, res, next) => {
    try {
      console.log("[onAnswer]", req.headers["x-neru-sessionid"] || "no", "x-neru-sessionid");
      console.log("[onAnswer]", req.body.conversation_uuid || "no", "conversation_uuid");
      console.log("[onAnswer]", req.body.uuid || "no", "call uuid");

      if (req.body.uuid) {
        const session = neru.createSession(); 
        const voice = new Voice(session); 
        await voice.onVapiEvent({ vapiUUID: req.body.uuid, callback:"/webhooks/onEvent" }).execute();
      }

      return await handleVapiAnswer(req, res, next);
    } catch (e) {
      console.log(e.message);
      next(e);
    }
  });

  router.post("/onEvent", async (req, res, next) => {
    try {
      console.log("[onEvent]", req.headers["x-neru-sessionid"] || "no", "x-neru-sessionid");
      console.log("[onEvent]", req.body.conversation_uuid || "no", "conversation_uuid");
      console.log("[onEvent]", req.body.uuid || "no", "call uuid");

      return await handleVapiEvent(req, res, next);
    } catch (e) {
      console.log(e.message);
      next(e);
    }
  });

  /** [] for when deployed to neru */
  router.post("/once", async (req, res, next) => {
    try {
      const session = neru.createSession();
      const voice = new Voice(session);
      const data = await voice.onVapiAnswer("/webhooks/onAnswer").execute();
      return res.json(data); 
    } catch (e) {
      console.log(e.message);
      next(e);
    }
  });
  
  return router;
};

module.exports = Router;
