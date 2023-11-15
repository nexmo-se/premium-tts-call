const { neru, Voice } = require("neru-alpha");

const createCall = async (from, to, ncco) => {
  const session = neru.createSession();
  const voice = new Voice(session);
  const data = await voice.vapiCreateCall({number: from}, [{number: to}], ncco).execute();
  console.log("createCall", data);
};

const {
  getFile,
  getTranscription,
  createUser,
  listUsers,
  delelteUser,
  generateJwtAcl,
} = require("./providers/NexmoApi");

module.exports = {
  createCall,
  getFile,
  getTranscription,
  createUser,
  listUsers,
  delelteUser,
  generateJwtAcl,
};
