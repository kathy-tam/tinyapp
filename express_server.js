/* Setup */
const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const bcrypt = require('bcrypt');
const { generateRandomString, getUserByEmail, urlsForUser } = require('./helpers.js');

const PORT = 8080; // default port 8080
const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['encryptdemcookiesnomnom']
}));
// Authentication Middleware
// app.use('/', (req, res, next) => {
//   const whiteList = ['/', 'urls', '/login'];
//   if (req.session.userID || whiteList.includes(req.path)) {
//     return next();
//   }
//   res.redirect('/');
// });

/* Replaced with cookie-session middleware
const cookieParser = require('cookie-parser');
app.use(cookieParser())
*/

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

const userDatabase = {
  "aJ48lW": {
    id: "aJ48lW",
    email: "user2@example.com",
    password: bcrypt.hashSync("dishwasher-funk", 10)
  }
};

/* Route Handlers */
// In each handler, check if user is logged in or not (authentication)
app.get('/', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls/');
  } else {
    res.redirect('/login');
  }
});

app.get('/urls', (req, res) => {
  const templateVars = { user: userDatabase[req.session.userID] };
  if (req.session.userID) {
    templateVars.urls = urlsForUser(req.session.userID, urlDatabase);
    res.render("urls_index", templateVars);
  } else {
    templateVars.message = "Please login or register to use TinyApp.";
    res.render('error', templateVars);
  }
});

app.get("/urls/new", (req, res) => {
  if (req.session.userID) {
    const templateVars = { user: userDatabase[req.session.userID] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  if (req.session.userID) {
    // Store longURL-shortURL pair in database
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.session.userID };
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
  } catch (err) {
    res.statusCode = 404;
    const templateVars = { message: "404 Page Not Found. Please check the shortURL and try again."};
    res.render('error', templateVars);
  }
});

app.get("/urls/:shortURL", (req, res) => {
  const id = req.session.userID;
  // if logged in and the creator
  if (id && urlsForUser(id, urlDatabase)[req.params.shortURL]) {
    const templateVars = { user: userDatabase[req.session.userID], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.render("urls_show", templateVars);
  // logged in and not the creator
  } else if (id && urlDatabase[req.params.shortURL]) {
    res.statusCode = 403;
    const templateVars = { user: userDatabase[req.session.userID], message: "403 Forbidden. Access to URL denied since you're not the URL creator."};
    res.render('error', templateVars);
  // not logged in
  } else if (urlDatabase[req.params.shortURL]) {
    res.statusCode = 403;
    const templateVars = { user: userDatabase[req.session.userID], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  //shortURL doesn't exist
  } else {
    res.statusCode = 404;
    const templateVars = { user: null, message: "404 Page Not Found. This shortURL doesn't exist."};
    res.render('error', templateVars);
  }
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.session.userID;
  const shortURL = req.params.shortURL;
  if (id && urlDatabase[shortURL].userID === id) {
    delete urlDatabase[shortURL];
    res.redirect('/urls/');
  } else {
    res.statusCode = 403;
    const templateVars = { user: userDatabase[id], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  }
});

// Edit URL
app.post("/urls/:shortURL/edit", (req, res) => {
  const id = req.session.userID;
  const shortURL = req.params.shortURL;
  if (id && urlDatabase[shortURL].userID === id) {
    urlDatabase[shortURL].longURL = req.body.longURL;
    res.redirect('/urls/');
  } else {
    res.statusCode = 403;
    const templateVars = { user: userDatabase[id], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  }
});

// Registration
app.get('/register', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: userDatabase[req.session.userID] };
    res.render('registration.ejs', templateVars);
  }
});

app.post('/register', (req, res) => {
  const {email, password} = req.body;
  const templateVars = { user: undefined};
  // Send 400 error if no email or password provided
  if (email === "" || password === "") {
    res.statusCode = 400;
    templateVars.message = "400 Bad Request. Please enter an email and/or password.";
    res.render('error', templateVars);
  // Send 400 error if email already registered
  } else if (getUserByEmail(email, userDatabase)) {
    res.statusCode = 400;
    templateVars.message = "400 Bad Request. Email already registered.";
    res.render('error', templateVars);
  // Otherwise, hash password and generate random ID to create new account. Create a cookie for the session
  } else {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const id = generateRandomString();
    userDatabase[id] = { id, email, hashedPassword };
    req.session.userID = id;
    res.redirect('/urls');
  }
});

// Login
app.get('/login', (req, res) => {
  if (req.session.userID) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: userDatabase[req.session.userID] };
    res.render('login.ejs', templateVars);
  }
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const user = getUserByEmail(email, userDatabase);
  // User doesn't exist
  if (!user) {
    res.statusCode = 403;
    const templateVars = { user: null, message: "403 Forbidden. Please register first." };
    res.render('error', templateVars);
  // Password doesn't match
  } else if (!bcrypt.compareSync(password, user.hashedPassword)) {
    res.statusCode = 403;
    const templateVars = { user: null, message: "403 Forbidden. Invalid password." };
    res.render('error', templateVars);
  // Authenticated login. Create a cookie for the session
  } else {
    req.session.userID = user.id;
    res.redirect('/urls/');
  }
});

// Logout
// Clear cookies and redirect
app.post("/logout", (req, res) => {
  // delete req.session.userID;
  req.session = null;
  res.redirect('/urls/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});