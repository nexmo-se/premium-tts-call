
if (!process.env.VCR_INSTANCE_PUBLIC_URL 
  || !process.env.VCR_API_ACCOUNT_ID
  || !process.env.VCR_API_ACCOUNT_SECRET
  || !process.env.VCR_API_APPLICATION_ID
  || !process.env.VCR_PRIVATE_KEY) {
  console.log("Please check environment variables in .env");
  process.exit(0);
}

const { initAppUser } = require("./vonage/users");
const { getTranscription } = require("./vonage/files");

const start = async (app) => {
  try {
    /// /// /// 
    await initAppUser("Alice");

    /// /// /// only for when deployed to VCR
    if (process.env.VCR_INSTANCE_SERVICE_NAME) {
      const { vcr, Voice } = require("@vonage/vcr-sdk");
      try {
        const session = vcr.getGlobalSession();
        const voice = new Voice(session);
        const listener = await voice.onCall("webhooks/answer");
        console.log('[onCall]', listener);
      } catch (error) {
        console.log(error.message);
      } 
    }

    /// /// /// 
    const PORT = process.env.VCR_PORT || 3000;
    app.listen(PORT, () => {
      console.log("APP listening on port", PORT);
    });
    
  } catch (error) {
    console.log(error.message);
    process.exit(0);
  }
};

const onTranscriptAvailable = async (url) => {
  const transcript = [];
  try {
    const lines = await getTranscription(url);
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
  start,
  onTranscriptAvailable,
};
