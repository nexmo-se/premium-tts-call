
const axios = require("axios");
const Nexmo = require("@vonage/server-sdk");

const PRIVATE_KEY = Buffer.from(process.env.PRIVATE_KEY);
const REGION = process.env.APP_VONAGE_REGION || "us"

const NEXMO_OPTIONS = {
  debug: process.env.DEBUG || false, 
  restHost: `rest-${REGION}.nexmo.com`, 
  apiHost: `api-${REGION}.nexmo.com`
};

const nexmo = new Nexmo({
  apiKey: process.env.API_ACCOUNT_ID,
  apiSecret: process.env.API_ACCOUNT_SECRET,
  applicationId: process.env.API_APPLICATION_ID,
  privateKey: PRIVATE_KEY
}, NEXMO_OPTIONS);

const createCall = async (param) => {
  try {
    return new Promise((resolve, reject) => {
      nexmo.calls.create(param, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  } catch (e) {
    console.log(e.message);
    throw new Error("[createCall] failed");
  }
};

const getFile = async (fileId) => {
  try {
    return new Promise((resolve, reject) => {
      nexmo.files.get(fileId, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      });
    });
  } catch (e) {
    console.log(e.message);
    throw new Error("[getFile] failed");
  }
};

const getTranscription = async (url) => {
  try {
    const jwt = nexmo.generateJwt();
    const config = {
      method: "get",
      url: url,
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": "Bearer " + jwt
      }
    };
    const { data } = await axios(config);
    if (!data.channels || !data.channels[0] || !data.channels[0].transcript) {
      return null;
    }
    return data.channels[0].transcript;
  } catch (e) {
    console.log(e.message);
    throw new Error("[getTranscription] failed");
  }
};

const createUser = async (name) => {
  try {
    return new Promise(function(resolve, reject) {
      nexmo.users.create({ name}, (error, res) => {
        if (error) return reject(error);
        resolve({...res, name});
      });
    });
  } catch (e) {
    console.log(e.message);
    throw new Error("[createUser] failed");
  }
};

const listUsers = async () => {
  try {
    return new Promise(function(resolve, reject) {
      nexmo.users.get({}, (error, res) => {
        if (error) return reject(error);
        resolve(res._embedded?.data?.users || []);
      });
    });
  } catch (e) {
    console.log(e.message);
    throw new Error("[listUsers] failed");
  }
};

const delelteUser = async (userId) => {
  try {
    return new Promise(function(resolve, reject) {
      nexmo.users.delete(userId, (error, res) => {
        if (error) return reject(error);
        resolve(res);
      });
    });
  } catch (e) {
    console.log(e.message);
    throw new Error("[delelteUser] failed");
  }
};

const generateJwtAcl = async (username) => {
  try {
    const aclPaths = {
      "paths": {
        "/*/users/**": {},
        "/*/conversations/**": {},
        "/*/sessions/**": {},
        "/*/devices/**": {},
        "/*/image/**": {},
        "/*/media/**": {},
        "/*/applications/**": {},
        "/*/push/**": {},
        "/*/knocking/**": {},
        "/*/legs/**": {}
      }
    };
    const jwt = Nexmo.generateJwt(PRIVATE_KEY, {
      application_id: process.env.API_APPLICATION_ID,
      sub: username,
      exp: Math.round(new Date().getTime() / 1000) + 86400,
      acl: aclPaths
    });
    return jwt;
  } catch (e) {
    console.log(e.message);
    throw new Error("[generateJwtAcl] failed");
  }
};

module.exports = {
  createCall,
  getFile,
  getTranscription,
  createUser,
  listUsers,
  delelteUser,
  generateJwtAcl,
};

