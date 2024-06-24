
const { buildNcco } = require("../lib/utils");
const { store } = require("../services/vonage/store");
const express = require("express");
const router = express.Router();

const handleVapiAnswer = async (req, res, next) => {
  try {
    console.log("[handleVapiAnswer]", JSON.stringify(req.body));

    if (req.headers["x-neru-sessionid"]) {
      const { vcr, Voice } = require("@vonage/vcr-sdk");
      const session = vcr.getGlobalSession();
      const voice = new Voice(session); 
      const listener = await voice.onCallEvent({ vapiID: req.body.uuid, callback: "webhooks/event" });
      console.log('[onCallEvent]', listener);
    }

    const customData = req.body.custom_data? JSON.parse(req.body.custom_data) : {};
    const payload = Object.assign({}, req.body, customData);

    const ncco = buildNcco(payload);

    if (payload.conversation_uuid && payload.userId) {
      await store.set(payload.conversation_uuid, payload.userId);

      req.app.emit(`inform-client-${payload.userId}`, { 
        type: "answer", 
        ncco, 
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

    const userId = await store.get(payload.conversation_uuid);
    if (!userId) return res.sendStatus(200);

    if (payload.recording_url) {
      req.app.emit("vapi-recording-available", {...payload, userId});
    }
    else if (payload.transcription_url) {
      req.app.emit("vapi-transcription-available", {...payload, userId});
    }
    else {
      req.app.emit(`inform-client-${userId}`, {
        ...payload,
        userId,
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

module.exports = router;
