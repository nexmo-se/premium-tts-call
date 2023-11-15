
const express = require("express");
const { buildNcco } = require("../lib/utils");
const router = express.Router();

const APP_URL = process.env.APP_URL || "";

const Router = (services) => {
  const { nexmo, users, store } = services;

  router.post("/create-call", async (req, res, next) => {
    try {
      const payload = req.body;
      const ncco = buildNcco(payload);
      const param = {
        from: { type: "phone", number: payload.from},
        to: [{ type: "phone", number: payload.to}],
        ncco: ncco,
        event_url: [`${APP_URL}/webhooks/event`]
      };

      const data = await nexmo.createCall(param);

      if (data && data.conversation_uuid && payload.userid) {
        await store.set(data.conversation_uuid, payload.userid);

        req.app.emit(`inform-client-${payload.userid}`, {
          type: "answer", 
          ncco: ncco, 
          conversation_uuid: data.conversation_uuid
        });
      }

      return res.json(data);
    } catch (e) {
      console.log(e.message);
      next(e);
    }
  });

  router.get("/realtime/:userid", async (req, res, next) => {
    try {
      const { userid } = req.params;
      if (!userid) throw new Error("empaty params userid");

      res.writeHead(200, {
        "Connection": "keep-alive",
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      });

      res.write("retry: 3000\n\n");

      req.app.on(`inform-client-${userid}`, (d) => {
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

      const data = await nexmo.getFile(fileId);

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

      // if (!users[username]) throw new Error("username not found");
      username = "Alice"; // Alice or Bob

      const jwt = await nexmo.generateJwtAcl(username);
      if (!jwt) throw new Error("failed to generate an JWT token");

      return res.json({ 
        username, 
        jwt, 
        lvn: process.env.APP_VONAGE_NUMBER || ""
      });

    } catch (e) {
      console.log(`[${req.originalUrl}]`, e.message);
      next(e);
    }
  });

  router.get("/users", async (req, res, next) => {
    try {
      return res.json(Object.values(users));
    } catch (e) {
      console.log(`[${req.originalUrl}]`, e.message);
      next(e);
    }
  });

  return router;
};

module.exports = Router;
