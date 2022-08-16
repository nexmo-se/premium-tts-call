const path = require('path');
const NexmoApi = require('../api/modules/NexmoApi');
const fs = require('fs');

const handleIndex = async function(req, res, next) {
  res.json(['ok!']); 
};

const buildNcco = function(payload, AppUrl) {
  console.log('build ncco', payload);
  var ncco = [{
    action: 'talk',
    text: payload.text,
    language: payload.language,
    style: payload.style,
    premium: payload.premium,
  }];
  if (payload.record) {
    var _ncco = {
      action: 'record',
      eventUrl: [
        `${AppUrl}/api/webhooks/event`
      ],
      format: 'wav',
      beepStart: true
    };
    if (payload.language == 'en-US') {
      _ncco.transcription = { language: 'en-US' }
    }
    ncco.unshift(_ncco);
  }
  return ncco;
}

const createCall = async function(req, res, next) {
  try {
    const payload = req.body;
    const ncco = buildNcco(payload, req.app.get('AppUrl'));
    const param = {
      to: [{ type: 'phone', number: payload.to}],
      from: { type: 'phone', number: payload.from},
      ncco: ncco
    };
    //console.log(param.to, param.from)
    var data = await NexmoApi.createCall(param);
    if (data && data.conversation_uuid) {
      req.app.set(data.conversation_uuid, payload.events_id);
      var event = { type: 'answer', ncco: ncco, conversation_uuid: data.conversation_uuid};
      req.app.emit(`vapi-webhooks-${payload.events_id}`, event);
    }
    res.json(data);
  } catch (e) {
    next(e)
  }
};

const handleCall = async function(req, res, next) {
  console.log(req.body, req.params, req.query);
  const customData = req.body.custom_data? JSON.parse(req.body.custom_data) : {};
  const payload = Object.assign({}, customData, req.body);
  const ncco = buildNcco(payload, req.app.get('AppUrl'));
  if (payload.conversation_uuid) {
    req.app.set(payload.conversation_uuid, payload.events_id);
    var event = { type: 'answer', ncco: ncco, conversation_uuid: payload.conversation_uuid};
    req.app.emit(`vapi-webhooks-${payload.events_id}`, event);
  }
  res.json(ncco);
}

const handleEvent = async function(req, res, next) {
  console.log(req.body, req.params, req.query, "\n\n");
  const payload = req.body;
  if (!payload.conversation_uuid) {
    return res.json(['ok!']);
  }
  var events_id = req.app.get(payload.conversation_uuid);
  if (payload.recording_url) {
    var filename = `${payload.recording_uuid}.wav`;
    await NexmoApi.download(payload.recording_url, path.join(__dirname, '/../build/') + filename);
    req.app.emit(`vapi-webhooks-${events_id}`, {...payload, 
      type: 'recording',
      filename: filename,
      transcript: null,
      recording_uuid: payload.recording_uuid
    });
  }
  else if (payload.transcription_url) {
    var t = await NexmoApi.getTranscription(payload.transcription_url);
    if (t) {
      var tt = [];
      t.forEach(obj => {
        for (const [key, value] of Object.entries(obj)) {
          if (key === 'sentence') tt.push(value);
        }
      });
      req.app.emit(`vapi-webhooks-${events_id}`, {...payload, 
        type: 'transcription',
        transcript: tt,
        filename: null,
        recording_uuid: payload.recording_uuid
      });
    }
  }
  else {
    req.app.emit(`vapi-webhooks-${events_id}`, {...payload, ...{type: 'event'}});
  }
  res.json(['ok!']);
}

const handleSse = async function(req, res, next) {
  var { eventsId } = req.params;
  try {
    res.writeHead(200, {
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    });
    res.write("retry: 20000\n\n");
    req.app.on(`vapi-webhooks-${eventsId}`, (_event) => {
      res.write(`data: ${JSON.stringify(_event)}\n\n`);
    });
    setInterval(() => {
      res.write("event: ping\n\n");
    }, 10000);
  } catch (e) {
    next(e)
  }
}

/**
 * create a user if username non-exist, 
 * and then generate a jwt token for it
 */
const getUser = async function(req, res, next) {
  var { username } = req.params;
  try {
    var found = findUser(username);
    if (!found) {
      try {
        let created = await NexmoApi.createUser(username);
        if (created) {
          const users = await NexmoApi.findUsers();
          storeUsers(users);
        }
        else throw 'failed to createUser';
      }
      catch (e) {
        console.log(e.message);
      }
    }
    const jwt = await NexmoApi.generateJwtAcl(username);
    if (!jwt) throw "failed to generate an JWT token";
    res.json({ username: username, jwt: jwt });
  } catch (e) {
    next(e)
  }
}

const getUsers = async function(req, res, next) {
  try {
    const users = await NexmoApi.findUsers();
    storeUsers(users);
    res.json(['getUsers ok!']);
  } catch (e) {
    next(e)
  }
}

const findUser = function (username) {
  try {
    var filename = path.join(__dirname, "users.log");
    if (!fs.existsSync(filename)) return null;
    var str = fs.readFileSync(filename, 'utf8', 'w+');
    var data = JSON.parse(str);
    var found = data.find(d => d.name == username);
    return found? found : null;
  } catch (e) {}
  return null;
}
const storeUsers = function (users) {
  try {
    var filename = path.join(__dirname, "users.log");
    fs.existsSync(filename) && fs.unlinkSync(filename);
    fs.writeFileSync(filename, JSON.stringify(users), 'utf8', 'w+');
  } catch (e) {}
  return null;
}

module.exports = {
  createCall,
  handleIndex,
  handleCall,
  handleEvent,
  handleSse,
  getUser,
  getUsers
};
