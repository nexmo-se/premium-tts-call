//require('dotenv').config();
const axios = require('axios');
const path = require('path');

const Nexmo = require('@vonage/server-sdk');

const PRIVATE_KEY = process.env.NERU_APP_PORT
  ? Buffer.from(process.env.PRIVATE_KEY, "utf-8") 
  : path.join(__dirname, "/../../" + process.env.API_PRIVATE_KEY)

const OPTIONS = {
  // debug: true, 
  restHost: "rest-us.nexmo.com", 
  apiHost: "api-us.nexmo.com"
}

class NexmoApi {
  static _nexmo;
  static get nexmo () {
    if (NexmoApi._nexmo == null) {
      NexmoApi._nexmo = new Nexmo(
        {
          apiKey: process.env.API_ACCOUNT_ID,
          apiSecret: process.env.API_SECRET,
          applicationId: process.env.API_APPLICATION_ID,
          privateKey: PRIVATE_KEY
        }, OPTIONS
      );
    }
    return NexmoApi._nexmo;
  }

  /**
   * 
   * @param {*} param
   * @returns {}
   */
  static async createCall(param) {
    try {
      return new Promise((resolve, reject) => {
        console.log(param);
        NexmoApi.nexmo.calls.create(param, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    } catch (e) {
      console.log(e);
      throw "failed to createCall"
    }
  }

  static async download(url, filename) {
    try {
      return new Promise((resolve, reject) => {
        NexmoApi.nexmo.files.save(url, filename, (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
    } catch (e) {
      console.log(e);
      throw "failed to download files"
    }
  }

  static async getTranscription(url) {
    try {
      const jwt = NexmoApi.nexmo.generateJwt();
      var config = {
        method: 'get',
        url: url,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer ' + jwt
        }
      };
      let { data } = await axios(config);
      if (!data.channels || !data.channels[0] || !data.channels[0].transcript) {
        return null;
      }
      return data.channels[0].transcript;
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  static async createUser(username) {
    try {
      return new Promise(function(resolve, reject) {
        NexmoApi.nexmo.users.create({"name": username}, (error, result) => {
          if (error) return reject(error);
          resolve({...result, name: username});
        });
      });
    } catch (e) {
      console.log(e);
      throw "failed to createUser"
    }
  }

  static async listUsers() {
    try {
      return new Promise(function(resolve, reject) {
        NexmoApi.nexmo.users.get({}, (error, result) => {
          if (error) return reject(error);
          resolve(result._embedded?.data?.users?? []);
        });
      });
    } catch (e) {
      console.log(e);
      throw "failed to listUsers"
    }
  }

  static async delelteUser(userId) {
    try {
      return new Promise(function(resolve, reject) {
        NexmoApi.nexmo.users.delete(userId, (error, result) => {
          if (error) return reject(error);
          resolve(result);
        });
      });
    } catch (e) {
      console.log(e);
      throw "failed to delelteUser"
    }
  }
  
  static async generateJwtAcl(username) {
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
      return null;
    }
  }
}

module.exports = NexmoApi;