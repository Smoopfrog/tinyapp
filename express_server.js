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

// Sample Databases
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

// Homepage
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// Redirects to the longURL associated with the tinyURL
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;

  if (!longURL) {
    return res.status(404).send('URL not found.')
  }
  
  res.redirect(longURL);
});

// Register page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.session.user_id]};

  // Returns to /urls page if logged in 
  if (users[req.session.user_id]) {
    return res.redirect('/urls')
  }

  res.render("urls_register", templateVars);
});

app.post('/register', (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;

  if (!enteredEmail || !enteredPassword) {
    return res.status(400).send("Please include an email and password.");
  }
  
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
  req.session.user_id = randomID;
  res.redirect('/');
});

// Login
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.session.user_id]};

  if (!users[req.session.user_id]) {
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

  req.session.user_id = user;
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
  if (!users[req.session.user_id]) {
    templateVars = { 
      user: users[req.session.user_id],
      urls: urlsForUser(users[req.session.user_id], urlDatabase) 
    };
  } else {
    templateVars = { 
      user: users[req.session.user_id],
      urls: urlsForUser(users[req.session.user_id].id, urlDatabase) 
    }
  }
  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  const tinyUrl = generateRandomString();
  
  if (!users[req.session.user_id]) {
    return res.status(403).send("Please log in to use this feature")
  }

  urlDatabase[tinyUrl] = {
    longURL:req.body.longURL,
    userID: users[req.session.user_id].id
  };
  res.redirect('urls/' + tinyUrl);
});

// Add URL
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session.user_id], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

//
app.get("/urls/:id", (req, res) => {
  const templateVars = { user: users[req.session.user_id], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

// Delete URL
app.post('/urls/:id/delete', (req, res) => {
  if (!users[req.session.user_id]) {
    return res.status(403).send("Please log in to use this feature")
  }
  delete urlDatabase[req.params.id];
  res.redirect('/urls');
});

// Edit URL
app.post('/urls/:id/edit', (req, res) => {
  if (users[req.session.user_id] === undefined) {
    return res.status(403).send("Please log in to use this feature")
  }
  
  urlDatabase[req.params.id] = {
    longURL: req.body.newURL,
    userID: users[req.session.user_id].id
  };
  res.redirect('/urls');
});

// URL json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});