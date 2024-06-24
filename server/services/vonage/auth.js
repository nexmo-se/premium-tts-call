const { Auth } = require("@vonage/auth");

const API_ACCOUNT_ID = process.env.VCR_API_ACCOUNT_ID;
const API_ACCOUNT_SECRET = process.env.VCR_API_ACCOUNT_SECRET;
const API_APPLICATION_ID = process.env.VCR_API_APPLICATION_ID;
const API_PRIVATE_KEY = process.env.VCR_PRIVATE_KEY;

const auth = new Auth({
  apiKey: API_ACCOUNT_ID,
  apiSecret: API_ACCOUNT_SECRET,
  applicationId: API_APPLICATION_ID,
  privateKey: API_PRIVATE_KEY,
});

const generateJwt = async (username = null, withAcl = false) => {
  try {
    const options = {
      applicationId: API_APPLICATION_ID,
      privateKey: API_PRIVATE_KEY,
    };

    if (withAcl) {
      options.jwtOptions = {
        subject: username,
        acl: {
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
        }
      };
    }
    const auth = new Auth(options);
    const bearerAuthHeader = await auth.createBearerHeader();
    return bearerAuthHeader.split(" ")[1];
  } catch (e) {
    console.log(e)
    throw new Error("[generateJwt] Error" + e.message);
  }
};

module.exports = {
  Auth,
  auth,
  generateJwt
}
