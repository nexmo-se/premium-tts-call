
require('dotenv').config();
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var createHttpError = require('http-errors');
var fs = require('fs');

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

app.set('AppUrl', process.env.APP_URL);

// routes
app.all('/api/create-call', createCall);
app.all('/api/users/:username', getUser);
app.all('/api/users', getUsers);
app.all('/api/events/realtime/:eventsId', handleSse);
app.all('/api/webhooks/answer', handleCall);
app.all('/api/webhooks/event', handleEvent);
app.all('/api', handleIndex);
app.post('/onCall', handleCall);
app.post('/onEvent', handleEvent);

app.get('/_/health', async (req, res, next) => {
    res.send('OK');
});

var dir = './build'
if (!fs.existsSync(dir)){
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

var PORT = process.env.APP_SERVER_PORT || 3002;
app.listen(PORT, () => console.log(`listening on port ${PORT}!`));
// #
