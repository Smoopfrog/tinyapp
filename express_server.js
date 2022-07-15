const express = require("express");
const app = express();
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const { generateRandomString, checkEmailIsRegistered, getUserIdFromEmail, urlsForUser } = require('./helpers');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use(cookieSession({
  name: 'session',
  keys: ['Bogart']
}));

// Password hash
const salt = bcrypt.genSaltSync(10);

// Databases
const urlDatabase = {};

const users = {};

// Homepage
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Redirects to the longURL associated with the tinyURL
app.get("/u/:id", (req, res) => {
  
  // Check if :id exists
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('Short url not found.');
  }

  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status(404).send('URL not found.');
  }
  
  res.redirect(longURL);
});

// Register page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.userId]};

  // Returns to /urls page if logged in
  if (users[req.session.userId]) {
    return res.redirect('/urls');
  }

  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  // Error if input fields are blank
  if (!enteredEmail || !enteredPassword) {
    return res.status(400).send("Please include an email and password.");
  }
  
  // Error if email is already registered
  if (checkEmailIsRegistered(enteredEmail, users)) {
    return res.status(400).send("Email already registered.");
  }
    
  // Set up new user
  const randomID = generateRandomString();
  users[randomID] = {
    id: randomID,
    email: enteredEmail,
    password: bcrypt.hashSync(enteredPassword, salt)
  };
  req.session.userId = randomID;
  res.redirect('/');
});

// Login
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.userId]};

  if (!users[req.session.userId]) {
    return res.render('urls_login', templateVars);
  }

  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = getUserIdFromEmail(enteredEmail, users);

  if (!checkEmailIsRegistered(enteredEmail, users)) {
    return res.status(403).send("Email is not registered.");
  }

  if (!bcrypt.compareSync(enteredPassword, users[user].password)) {
    return res.status(403).send("Password is incorrect.");
  }

  req.session.userId = user;
  res.redirect('urls');
});

// Logout
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('urls');
});

// URLs
app.get("/urls", (req, res) => {
  let templateVars = {};

  if (!users[req.session.userId]) {
    templateVars = {
      user: users[req.session.userId],
      urls: urlsForUser(users[req.session.userId], urlDatabase)
    };
  } else {
    templateVars = {
      user: users[req.session.userId],
      urls: urlsForUser(users[req.session.userId].id, urlDatabase)
    };
  }

  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  const tinyUrl = generateRandomString();
  
  if (!users[req.session.userId]) {
    return res.status(403).send("Please log in to use this feature");
  }

  urlDatabase[tinyUrl] = {
    longURL: req.body.longURL,
    userID: users[req.session.userId].id
  };
  res.redirect('urls/' + tinyUrl);
});

// Add new URL
app.get("/urls/new", (req, res) => {
  if (!users[req.session.userId]) {
    return res.redirect('/login');
  }

  const templateVars = { user: users[req.session.userId], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

// Url edit page
app.get("/urls/:id", (req, res) => {
  
  // Check if :id exists
  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('Short url not found.');
  }

  // Check if signed in
  if (!users[req.session.userId]) {
    return res.status(403).send("Please log in to use this feature.");
  }

  // Check if the current userID matches the URL userID
  if(urlDatabase[req.params.id].userID !== users[req.session.userId].id) {
    return res.status(403).send("Not authorized with this account.");
  }

  const templateVars = { user: users[req.session.userId], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

// Delete URL
app.post('/urls/:id/delete', (req, res) => {
  if (!users[req.session.userId]) {
    return res.status(403).send("Please log in to use this feature");
  }

  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Edit URL
app.post('/urls/:id/edit', (req, res) => {
  if (users[req.session.userId] === undefined) {
    return res.status(403).send("Please log in to use this feature");
  }
  
  urlDatabase[req.params.id] = {
    longURL: req.body.newURL,
    userID: users[req.session.userId].id
  };
  res.redirect('/urls');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});