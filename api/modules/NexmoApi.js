//require('dotenv').config();
const axios = require('axios');
const path = require('path');
const Nexmo = require('@vonage/server-sdk');

const PRIVATE_KEY = process.env.NERU_APP_PORT? Buffer.from(process.env.PRIVATE_KEY, "utf-8") 
  : path.join(__dirname, "/../../" + process.env.PRIVATE_KEY)
const OPTIONS = {
  //debug: true, 
  restHost: "rest-us-1.nexmo.com", 
  apiHost: "api-us-1.nexmo.com"
}

class NexmoApi {
  static _nexmo;
  static get nexmo () {
    if (NexmoApi._nexmo == null) {
      NexmoApi._nexmo = new Nexmo(
        {
          apiKey: process.env.API_ACCOUNT_ID,
          apiSecret: process.env.API_API_SECRET,
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
   * @returns {
        uuid: 'd7e8a9ba-faba-433d-9bf0-e39e3e0e01ca',
        status: 'started',
        direction: 'outbound',
        conversation_uuid: 'CON-37ba2582-cccc-47e9-85d7-beac03ee448b'
      }
   */
  static async createCall(param) {
    return new Promise((resolve, reject) => {
      NexmoApi.nexmo.calls.create(param, (err, result) => {
        console.log(err || result);
        if (err) reject(err)
        else resolve(result)
      });
    });
  }

  static async download(url, filename) {
    return new Promise((resolve, reject) => {
      NexmoApi.nexmo.files.save(url, filename, (err, result) => {
        console.log(err || result);
        if (err) reject(err)
        else resolve(result)
      });
    });
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
      //console.log(typeof data, data);
      if (!data.channels || !data.channels[0] || !data.channels[0].transcript) {
        return null;
      }
      return data.channels[0].transcript;
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  static async findUsers() {
    try {
      const jwt = NexmoApi.nexmo.generateJwt();
      var config = {
        method: 'GET',
        url: `https://${OPTIONS.apiHost}/v0.1/users`,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer ' + jwt
        }
      };
      let { data } = await axios(config);
      console.log(data)
      return data
    } catch (e) {
      console.log(e.message);
      return []
    }
  }

  static async createUser(username) {
    try {
      const jwt = NexmoApi.nexmo.generateJwt();
      var config = {
        method: 'POST',
        url: `https://${OPTIONS.apiHost}/v0.1/users`,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer ' + jwt
        },
        data: JSON.stringify({
          'name': username
        })
      };
      let { data } = await axios(config);
      console.log(data)
      return data;
    } catch (e) {
      console.log(e.message, e.response?.data);
      return null;
    }
  }

  static async delUser(userId) {
    try {
      const jwt = NexmoApi.nexmo.generateJwt();
      var config = {
        method: 'DELETE',
        url: `https://${OPTIONS.apiHost}/v0.1/users/${userId}`,
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': 'Bearer ' + jwt
        }
      };
      let { data } = await axios(config);
      console.log(data)
      return data;
    } catch (e) {
      console.log(e.message, e.response?.data);
      return null;
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
      const Nexmo = require('@vonage/server-sdk');
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