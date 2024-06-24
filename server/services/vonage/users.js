const { auth } = require("./auth");
const { Users } = require("@vonage/users");

const usersClient = new Users(auth);

const initAppUser = async (username) => {
  try {

    try {
      return await usersClient.getUser(username);
    } catch (e) {
      if (!e.response) throw new Error("[initAppUser] Error" + e.message);

      const { code, detail } = await e.response.json();
      if (code == 'user:error:not-found') {
        return await usersClient.createUser({name: username});
      } else {
        throw new Error("[initAppUser] Error" + code + detail);
      }
    }

  } catch (error) {
    throw new Error("[initAppUser] Error: " + e.message);
  }
};

module.exports = {
  initAppUser,
  usersClient
}
