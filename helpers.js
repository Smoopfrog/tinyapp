// Helper functions
const generateRandomString = () => {
  let tinyUrl = "";
  const characterList = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    tinyUrl += characterList.charAt(Math.floor(Math.random() * characterList.length));
  }
  return tinyUrl;
};

const checkEmailIsRegistered = (email, database) => {
  for (const user in database) {
    if (database[user].email === email) {
      return true;
    }
  }
  return false;
};

const getUserIdFromEmail = function(email, database) {
  for (const user in database) {
    if (database[user].email === email) {
      return database[user].id;
    }
  }
  return undefined;
};

const urlsForUser = (id, database) => {
  let userUrls = {};
  for (const shortUrl in database) {
    if (database[shortUrl].userID === id) {
      userUrls[shortUrl] = database[shortUrl];
    }
  }
  return userUrls;
};

module.exports = {
  generateRandomString,
  checkEmailIsRegistered,
  getUserIdFromEmail,
  urlsForUser
};