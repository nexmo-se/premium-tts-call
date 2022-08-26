
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var createHttpError = require('http-errors');
var fs = require('fs');
var { neru, Voice } = require("neru-alpha");

var app = express();

var {
  createCall,
  handleIndex,
  handleCall,
  handleEvent,
  handleSse,
  getUser,
  getUsers
} = require('./api/PremiumTTS');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'build')));

const session = neru.createSession();
const voice = new Voice(session);
const init = async () =>  {
  await voice.onVapiAnswer('onCall').execute();
}
init();

app.set('AppUrl', neru.getAppUrl());

app.all('/api/create-call', createCall);
app.all('/api/users/:username', getUser);
app.all('/api/users', getUsers);
app.all('/api/events/realtime/:eventsId', handleSse);
app.all('/api/webhooks/answer', handleCall);
app.all('/api/webhooks/event', handleEvent);
app.all('/api', handleIndex);
app.post('/onCall', async function(req, res, next) {
  try {
    const session = neru.createSession(); 
    const voice = new Voice(session); 
    await voice.onVapiEvent({ vapiUUID: req.body.uuid, callback:'/onEvent' }).execute();
    // await voice.onVapiEvent({conversationID: req.body.conversation_uuid, callback:'/onEvent'}).execute();
    return await handleCall(req, res, next);
  } catch (error) {
    next(error);
  }
});
app.post('/onEvent', async (req, res, next) => {
  const session = neru.getSessionFromRequest(req);

  if (req.body && req.body.conversation_uuid) {
    var events_id = req.app.get(req.body.conversation_uuid);
    session.log("info", "custom onEvent", {...req.body, events_id});
  }

  return await handleEvent(req, res, next)
});

app.get('/_/health', async (req, res, next) => {
    res.send('OK');
});

var dir = './build'
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { mask: 0o0766, recursive: true });
}

/** error Not Found */
app.use(function(req, res, next) {
  next(createHttpError(404, `Not Found [${req.originalUrl}]`));
})
/** error Final handler */
app.use(function (err, req, res, next) {
  console.error(err)
  res.status(500).json({"message": "Something is wrong", "error": err.message?? err});
})

app.listen(process.env.NERU_APP_PORT, () => console.log(`listening on port ${process.env.NERU_APP_PORT}!`));
