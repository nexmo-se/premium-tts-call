const { auth } = require("./auth");
const axios = require("axios");

const PATH = "https://api-us.nexmo.com/v1/files";

const getFile = async (fileIdOrUrl) => {
  try {
    const fileId = fileIdOrUrl.split("/").pop(-1);
    const config = {
      url: PATH + "/" + fileId,
      method: "get",
      headers: { 
        "Authorization": await auth.createBearerHeader()
      },
      responseType: 'arraybuffer'
    };
    const response = await axios(config);
    return Buffer.from(response.data);
  } catch (e) {
    console.log(e.response.data || e.message);
    throw new Error("[getFile] Error" + e.response.data || e.message);
  }
};

const getTranscription = async (fileIdOrUrl) => {
  try {
    const fileId = fileIdOrUrl.split("/").pop(-1);
    const config = {
      url: PATH + "/" + fileId,
      method: "get",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": await auth.createBearerHeader()
      }
    };
    const { data } = await axios(config);
    return data?.channels[0]?.transcript || null;
  } catch (e) {
    throw new Error("[getTranscription] Error" + e.message);
  }
};

module.exports = {
  getFile,
  getTranscription,
};
