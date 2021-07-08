/* Helper Functions */

// Generate string of 6 random alphanumeric characters for "unique" shortURL
const generateRandomString = function() {
  const alphanumeric = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const length = 6;
  let result = '';
  for (let i = length; i > 0; i--) {
    result += alphanumeric[Math.floor(Math.random() * alphanumeric.length)];
  }
  return result;
}

// Get user with specified email
const getUserByEmail = function(email, database) {
  for (let user in database) {
    if (database[user].email === email) {
      return database[user];
    };
  }
  return undefined;
}

// Filter URL database for a user's URLs
const urlsForUser = function(id, database) {
  let urls = { ...database };
  for (let url in urls) {
    if (urls[url].userID !== id) {
      delete urls[url]
    };
  }
  return urls;
}

module.exports = { generateRandomString, getUserByEmail, urlsForUser };