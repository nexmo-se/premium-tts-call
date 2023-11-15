
if (!process.env.APP_URL 
  || !process.env.API_ACCOUNT_ID
  || !process.env.API_ACCOUNT_SECRET
  || !process.env.API_APPLICATION_ID
  || !process.env.PRIVATE_KEY) {
  console.log("Please check environment variables in .env");
  process.exit(0);
}

// const store = require("./StoreNeru"); // when running with neru
// const nexmo = require("./NexmoNeru"); // when running with neru


const store = new Map();
const nexmo = require("./NexmoLocal");  // when running others


const users = JSON.parse(process.env.APP_USERS || "{}");


const start = async (app) => {
  try {
    const arr = await nexmo.listUsers();
    arr.forEach((i) => {
      users[i.name] = {
        id: i.id,
        name: i.name
      };
    });
    // console.log(JSON.stringify(users, null, 4));

    const PORT = process.env.NERU_APP_PORT || 3000;
    app.listen(PORT, () => {
      console.log("APP listening on port", PORT);
      // console.log(process.env.PRIVATE_KEY);
    });
    
  } catch (error) {
    console.log(error.message);
    process.exit(0);
  }
};


const onTranscriptAvailable = async (url) => {
  const transcript = [];
  try {
    const lines = await nexmo.getTranscription(url);
    if (lines) {
      lines.forEach(line => {
        for (const [key, value] of Object.entries(line)) {
          if (key === "sentence") transcript.push(value);
        }
      });
    }
  } catch (error) {
    console.log(error.message);
  }
  return transcript;
};


module.exports = {
  store,
  nexmo,
  users,
  start,
  onTranscriptAvailable
};

