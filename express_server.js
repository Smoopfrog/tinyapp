const express = require("express");
const app = express();
const cookies = require('cookie-parser');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookies());

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
};

// Sample Databases
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

// Homepage
app.get("/", (req, res) => {
  res.redirect("/urls");
});

//
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

// Register page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  if (!enteredEmail || !enteredPassword) {
    res.status(400).send("Please include an email and password.");
  } else if (checkEmailIsRegistered(enteredEmail, users)) {
    res.status(400).send("Email already registered.");
  } else {
    const randomID = generateRandomString();
    users[randomID] = {
      id: randomID,
      email: enteredEmail,
      password: enteredPassword
    };
    res.cookie('user_id', randomID);
    res.redirect('/');
  }
});

// Login
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  res.render('urls_login', templateVars);
});

app.post('/login', (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = getUserIdFromEmail(enteredEmail, users);

  if (!checkEmailIsRegistered(enteredEmail, users)) {
    res.status(403).send("Email is not registered.");
  } else if (enteredPassword !== users[user].password) {
    res.status(403).send("Password is incorrect.");
  } else {
    res.cookie('user_id', user);
    res.redirect('urls');
  }
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('user_id');
  res.redirect('urls');
});

// URLs
app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], urls: urlDatabase };
  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  const tinyUrl = generateRandomString();
  urlDatabase[tinyUrl] = req.body.longURL;
  res.redirect('urls/' + tinyUrl);
});

// Add URL
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

//
app.get("/urls/:id", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// Delete URL
app.post('/urls/:id/delete', (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Edit URL
app.post('/urls/:id/edit', (req, res) => {
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect('/urls');
});

// URL json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});