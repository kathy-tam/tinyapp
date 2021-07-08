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
  return null;
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

/* Setup */
const express = require('express');
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended: true}));

/* Replaced with cookie-session middleware 
const cookieParser = require('cookie-parser');
const { response } = require("express");
app.use(cookieParser())
*/

const cookieSession = require('cookie-session');
app.use(cookieSession({
  name: 'session',
  // keys = [],
  secret: 'encryptdemcookiesnomnom'
}));

const bcrypt = require('bcrypt');

/* Database Objects */
const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  }, 
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

const users = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW"
  }, 
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW"
  }
};

/* Route Handlers */

// Authentication Middleware
// app.use('/', (req, res, next) => {
//   const whiteList = ['/', 'urls', '/login'];
//   if (req.session.user_id || whiteList.includes(req.path)) {
//     return next();
//   }
//   res.redirect('/');
// });

app.get('/', (req, res) => {
  res.redirect('/urls/');
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get('/urls', (req, res) => {
  const templateVars = { user: users[req.session.user_id] };
  if (req.session.user_id) {
    templateVars.urls = urlsForUser(req.session.user_id, urlDatabase);
    res.render("urls_index", templateVars);
  } else {
    templateVars.message = "Please login or register to use TinyApp.";
    res.render('error', templateVars)
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    const templateVars = { user: users[req.session.user_id] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  if (req.session.user_id) {
    // Store longURL-shortURL pair in database
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.user_id };
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.statusCode = 403;
    const templateVars = { message: "403 Forbidden. Please login or register." };
    res.render('error', templateVars);
  }
});

app.get("/u/:shortURL", (req, res) => {
  try {
    const longURL = urlDatabase[req.params.shortURL].longURL;
    res.redirect(longURL);
  } catch {
    res.statusCode = 404;
    const templateVars = { message: "404 Page Not Found. Please check the shortURL and try again."};
    res.render('error', templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.session.user_id;
  if(id && urlsForUser(id, urlDatabase)[req.params.shortURL]) {
    const templateVars = { user: users[req.session.user_id], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.render("urls_show", templateVars);
  } else if (id && urlDatabase[req.params.shortURL]){
    res.statusCode = 403;
    const templateVars = { user: users[req.session.user_id], message: "403 Forbidden. Access to URL denied since you're not the URL creator."};
    res.render('error', templateVars);
  } else if (urlDatabase[req.params.shortURL]) {
    res.statusCode = 403;
    const templateVars = { user: users[req.session.user_id], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  } else {
    res.statusCode = 404;
    const templateVars = { user: null, message: "404 Page Not Found. This shortURL doesn't exist."};
    res.render('error', templateVars);
  }
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (id && urlDatabase[shortURL].userID === id){
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls/');
  } else {
    res.statusCode = 403;
    const templateVars = { user: users[req.session.user_id], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  }
});

// Edit URL
app.post("/urls/:shortURL/edit", (req, res) => {
  const id = req.session.user_id;
  const shortURL = req.params.shortURL;
  if (id && urlDatabase[shortURL].userID === id){
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls/');
  } else {
    res.statusCode = 403;
    const templateVars = { user: users[req.session.user_id], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  }
});

// Registration page
app.get('/register', (req, res) => {
  if(req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render('registration.ejs', templateVars);
  }
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  // Send 400 error if no email or password provided
  const templateVars = { user: undefined};
  if(email === "" || password === "") {
    res.statusCode = 400;
    templateVars.message = "400 Bad Request. Please enter an email and/or password.";
    res.render('error', templateVars);
  } else if (getUserByEmail(email, users)) {
    // Send 400 error if email already registered
    res.statusCode = 400;
    templateVars.message = "400 Bad Request. Email already registered.";
    res.render('error', templateVars);
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = generateRandomString();
    users[id] = { id, email, hashedPassword };
    req.session.user_id = id;
    res.redirect('/urls');
  }
});

// Login page
app.get('/login', (req, res) => {
  if(req.session.user_id) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[req.session.user_id] };
    res.render('login.ejs', templateVars);
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  user = getUserByEmail(email, users);
  if (!user) {
    res.statusCode = 403;
    const templateVars = { user: null, message: "403 Forbidden. Please register first." };
    res.render('error', templateVars);
  } else if (!bcrypt.compareSync(password, user.hashedPassword)) {
    res.statusCode = 403;
    const templateVars = { user: null, message: "403 Forbidden. Invalid password." };
    res.render('error', templateVars);
  } else {
    req.session.user_id = user.id;
    res.redirect('/urls/');
  }
});

// Logout
app.post("/logout", (req, res) => {
  // delete req.session.user_id;
  req.session = null;
  res.redirect('/urls/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});