const express = require("express");
const app = express();
const cookies = require('cookie-parser');
const bcrypt = require("bcryptjs")
const PORT = 8080; // default port 8080

// Password hash
const salt = bcrypt.genSaltSync(10);

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

const urlsForUser = (id, database) => {
  let userUrls = {};
  for (const shortUrl in database) {
    if(database[shortUrl].userID === id) {
      userUrls[shortUrl] = database[shortUrl];
    }
  }
  return userUrls;
};

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
    res.status
  } else {
    res.redirect(longURL);
  }
});

// Register page
app.get('/register', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  if (users[req.cookies.user_id]) {
    res.redirect('/urls')
  } else {
    res.render("urls_register", templateVars);
  }
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
      password: bcrypt.hashSync(enteredPassword, salt)
    };
    res.cookie('user_id', randomID);
    res.redirect('/');
  }
});

// Login
app.get('/login', (req, res) => {
  const templateVars = { user: users[req.cookies.user_id]};
  if (users[req.cookies.user_id] === undefined) {
    res.render('urls_login', templateVars);
  } else {
    res.redirect('/urls');
  }
});

app.post('/login', (req, res) => {
  const enteredEmail = req.body.email;
  const enteredPassword = req.body.password;
  const user = getUserIdFromEmail(enteredEmail, users);
  if (!checkEmailIsRegistered(enteredEmail, users)) {
    res.status(403).send("Email is not registered.");
  } else if (!bcrypt.compareSync(enteredPassword, users[user].password)) {
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
  let templateVars = {};
  if (users[req.cookies.user_id] === undefined) {
    templateVars = { 
      user: users[req.cookies.user_id],
      urls: urlsForUser(users[req.cookies.user_id], urlDatabase) 
    };
  } else {
    templateVars = { 
      user: users[req.cookies.user_id],
      urls: urlsForUser(users[req.cookies.user_id].id, urlDatabase) 
    }
  }
  res.render("urls_index", templateVars);
});

app.post('/urls', (req, res) => {
  const tinyUrl = generateRandomString();
  if (users[req.cookies.user_id] === undefined) {
    res.status(403).send("Please log in to use this feature")
  } else {
    urlDatabase[tinyUrl] = {
      longURL:req.body.longURL,
      userID: users[req.cookies.user_id].id
    };
    res.redirect('urls/' + tinyUrl);
  }
});

// Add URL
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], urls: urlDatabase };
  res.render("urls_new", templateVars);
});

//
app.get("/urls/:id", (req, res) => {
  const templateVars = { user: users[req.cookies.user_id], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

// Delete URL
app.post('/urls/:id/delete', (req, res) => {
  if (users[req.cookies.user_id] === undefined) {
    res.status(403).send("Please log in to use this feature")
  } else {
    delete urlDatabase[req.params.id];
  }
    res.redirect('/urls');
});

// Edit URL
app.post('/urls/:id/edit', (req, res) => {
  if (users[req.cookies.user_id] === undefined) {
    res.status(403).send("Please log in to use this feature")
  } else {
    urlDatabase[req.params.id] = {
      longURL: req.body.newURL,
      userID: users[req.cookies.user_id].id
    };
  }
  res.redirect('/urls');
});

// URL json
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});