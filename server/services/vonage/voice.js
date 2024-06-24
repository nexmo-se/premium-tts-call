const { auth } = require("./auth");
const { Voice } = require("@vonage/voice");

const voiceClient = new Voice(auth);

const createOutboundCall = async (params) => {
  try {
    return await voiceClient.createOutboundCall(params);
  } catch (e) {
    throw new Error("[createOutboundCall] Error" + e.message);
  }
};

module.exports = {
  createOutboundCall,
  voiceClient
};
