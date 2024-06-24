require("dotenv").config();
const express = require("express");
const logger = require("morgan");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const createHttpError = require("http-errors");

const {onTranscriptAvailable, start} = require("./services/index");
const apiRouter = require("./routes/api");
const webhooksRouter = require("./routes/webhooks");

const app = express();

app.use(logger("tiny", { skip: (req) => {
  const p = req.originalUrl.split("/");
  return (p && p.length)
    ? ["_", "favicon.ico", "manifest.json", "images", "static"].includes(`${p[1]}`) 
    || "/api/users" === `/${p[1]}/${p[2]}`
    : false;
}}));
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("build"));

app.on("vapi-recording-available", async (e) => {
  try {
    const { userId }  = e;
    app.emit(`inform-client-${userId}`, {
      ...e, 
      type: "recording",
      transcript: null,
      file_uuid: e.recording_url.substring(e.recording_url.length - 36),
      recording_uuid: e.recording_uuid
    });
  } catch (error) {
    console.log(error.message);
  }
});

app.on("vapi-transcription-available", async (e) => {
  try {
    const arr = await onTranscriptAvailable(e.transcription_url);
    if (arr.length) {
      const { userId }  = e;
      app.emit(`inform-client-${userId}`, {
        ...e, 
        type: "transcription",
        transcript: arr,
        file_uuid: null,
        recording_uuid: e.recording_uuid
      });
    }
  } catch (error) {
    console.log(error.message);
  }
});

app.get("/_/health", async (req, res) => {
  return res.sendStatus(200);
});
app.get("/_/metrics", async (req, res) => {
  return res.sendStatus(200);
});

app.use("/api/", apiRouter);
app.use("/webhooks/", webhooksRouter);

app.use(function(req, res, next) {
  console.log("are you lost?", req.originalUrl);
  next(createHttpError(404, "Not Found"));
});

app.use(function (err, req, res, next) {
  if (app.get("env") === "development" || process.env.DEBUG) console.error(err);
  const code = err.statusCode || err.status || 500;
  const detail = err.message || (typeof err === "string"? err : "Something went wrong");
  return res.status(code).json({ error: { detail, code } });
});

process.on("uncaughtException", console.error);

start(app);
