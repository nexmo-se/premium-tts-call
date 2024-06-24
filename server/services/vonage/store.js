var store = new Map();

if (process.env.VCR_INSTANCE_SERVICE_NAME) {
  const { vcr } = require("@vonage/vcr-sdk");
  const STATE_TTL = 7200;

  store = {
    set: async (key, value) => {
      const state = vcr.getInstanceState();
      await state.set(key, value);
      await state.expire(key, STATE_TTL);
    },
    get: async (key, value) => {
      const state = vcr.getInstanceState();
      return await state.get(key);
    }
  }
}

module.exports = {
  store,
};
