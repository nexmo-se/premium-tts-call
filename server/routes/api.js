
const { buildNcco } = require("../lib/utils");
const { generateJwt } = require("../services/vonage/auth");
const { createOutboundCall } = require("../services/vonage/voice");
const { getFile } = require("../services/vonage/files");
const { store } = require("../services/vonage/store");
const express = require("express");
const router = express.Router();

const APP_PUBLIC_URL = process.env.VCR_INSTANCE_PUBLIC_URL;
const VONAGE_NUMBER = process.env.VONAGE_NUMBER;

router.post("/create-outbound-call", async (req, res, next) => {
  try {
    const payload = req.body;
    const ncco = buildNcco(payload);

    const data = await createOutboundCall({
      from: { type: "phone", number: VONAGE_NUMBER},
      to: [{ type: "phone", number: payload.to}],
      ncco,
      event_url: [`${APP_PUBLIC_URL}/webhooks/event`],
    });

    if (data && data.conversationUUID && payload.userId) {
      await store.set(data.conversationUUID, payload.userId);

      req.app.emit(`inform-client-${payload.userId}`, {
        type: "answer", 
        ncco, 
        conversation_uuid: data.conversationUUID
      });
    }

    return res.json(data);
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.get("/realtime/:userId", async (req, res, next) => {
  try {
    
    const { userId } = req.params;
    if (!userId) throw new Error("empaty params userId");

    res.writeHead(200, {
      "Connection": "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });

    res.write("retry: 3000\n\n");

    req.app.on(`inform-client-${userId}`, (d) => {
      res.write(`data: ${JSON.stringify(d)}\n\n`);
    });

    setInterval(() => {
      res.write("event: ping\n\n");
    }, 3000);
    
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

router.get("/recordings/:fileId", async (req, res, next) => {
  try {
    const { fileId } = req.params;
    if (!fileId) throw new Error("empaty params fileId");

    const data = await getFile(fileId);

    res.setHeader("Content-Type", "application/octet-stream");
    res.write(data);
    res.end();
    
  } catch (e) {
    console.log(e.message);
    next(e);
  }
});

/**
 * generate a jwt token for username
*/
router.get("/users/:username", async (req, res, next) => {
  try {
    var { username } = req.params;
    if (!username) throw new Error("empaty params username");

    // this is just for testing
    username = "Alice"; 

    const jwt = await generateJwt(username, true);
    if (!jwt) throw new Error("failed to generate an JWT token");

    return res.json({ jwt });
  } catch (e) {
    console.log(`[${req.originalUrl}]`, e.message);
    next(e);
  }
});

module.exports = router;
