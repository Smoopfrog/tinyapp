const { generateRandomString, checkEmailIsRegistered, getUserIdFromEmail, urlsForUser } = require('../helpers');
const { assert } = require('chai');

// Test Databases
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "userRandomID",
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "password",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// Tests
describe('generateRandomString', () => {
  it('Should return a unique string when called', () => {
    const firstString = generateRandomString();
    const secondString = generateRandomString();
    assert.notEqual(firstString, secondString);
  });

  it('should return a six character string', () => {
    const randomStringLength = generateRandomString().length;
    const expectedLength = 6;
    assert.equal(randomStringLength, expectedLength);
  });
});

describe('checkEmailIsRegistered', () => {
  it('Return false if email is not in the user database', () => {
    const falseEmail = checkEmailIsRegistered('false@email.ca', users);
    assert.isFalse(falseEmail);
  });

  it('Return true if email is in the user database', () => {
    const realEmail = checkEmailIsRegistered('user@example.com', users);
    assert.isTrue(realEmail);
  });
});

describe('getUserIdFromEmail', () => {
  it('Return undefined if email doesn\'t exist', () => {
    const invalidID = getUserIdFromEmail('false@email.ca', users);
    assert.isUndefined(invalidID);
  });

  it('Returns correct userID from database', () => {
    const validUserID = getUserIdFromEmail('user@example.com', users);
    const expectedID = "userRandomID";
    assert.equal(validUserID, expectedID);
  });
});

describe('urlsForUser', () => {
  it('Return an empty object if there are no URLs associated with the ID', () => {
    const userUrls = urlsForUser(users.user2RandomID.id, urlDatabase);
    const expectedURLs = {};
    assert.deepEqual(userUrls, expectedURLs);
  });

  it('Return the all the URLs associated with the ID', () => {
    const userUrls = urlsForUser(users.userRandomID.id, urlDatabase);
    const expectedURLs = {
      b6UTxQ: { longURL: 'https://www.tsn.ca', userID: 'userRandomID' },
      i3BoGr: { longURL: 'https://www.google.ca', userID: 'userRandomID' }
    };
    assert.deepEqual(userUrls, expectedURLs);
  });
});
