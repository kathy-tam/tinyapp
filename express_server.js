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

// Find user with specified email
const findUser = function(email) {
  for(let user in users) {
    if(users[user].email === email) { return users[user] };
  }
  return null;
}

// Filter URL database for a user's URLs
const urlsForUser = function(id) {
  let urls = { ...urlDatabase };
  for(let url in urls) {
    if(urls[url].userID !== id) { delete urls[url] };
  }
  return urls;
}

const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.set('view engine', 'ejs');

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

const cookieParser = require('cookie-parser');
const { response } = require("express");
app.use(cookieParser())

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
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
 "aJ48lW": {
    id: "aJ48lW", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
}

app.get("/", (req, res) => {
  res.redirect('/urls/');
});

// app.get("/urls.json", (req, res) => {
//   res.json(urlDatabase);
// });

// app.get("/hello", (req, res) => {
//   res.send("<html><body>Hello <b>World</b></body></html>\n");
// });

app.get("/urls", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]] };
  if(req.cookies['user_id']) {
    templateVars.urls = urlsForUser(req.cookies["user_id"]);
    res.render("urls_index", templateVars);
  } else {
    templateVars.message = "Please login or register to use TinyURL.";
    res.render('error', templateVars)
  }
});

app.get("/urls/new", (req, res) => {
  console.log(req.cookies["user_id"])
  if(req.cookies["user_id"]) {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render("urls_new", templateVars);
  } else {
    res.redirect('/login');
  }
});

app.post("/urls", (req, res) => {
  if(req.cookies["user_id"]) {
    // Store longURL-shortURL pair in database
    const shortURL = generateRandomString();
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: req.cookies["user_id"] };
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
  const id = req.cookies["user_id"];
  if(id && urlsForUser(id)[req.params.shortURL]) {
    const templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
    res.render("urls_show", templateVars);
  } else if (id){
    res.statusCode = 403;
    const templateVars = { user: users[req.cookies["user_id"]], message: "403 Forbidden. Access to URL denied since you're not the URL creator."};
    res.render('error', templateVars);
  } else {
    res.statusCode = 403;
    const templateVars = { user: users[req.cookies["user_id"]], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  }
});

// Delete URL
app.post("/urls/:shortURL/delete", (req, res) => {
  const id = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  if (id && urlDatabase[shortURL].userID === id){
    delete urlDatabase[req.params.shortURL];
    res.redirect('/urls/');
  } else {
    res.statusCode = 403;
    const templateVars = { user: users[req.cookies["user_id"]], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  }
});

// Edit URL
app.post("/urls/:shortURL/edit", (req, res) => {
  const id = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  if (id && urlDatabase[shortURL].userID === id){
    urlDatabase[req.params.shortURL].longURL = req.body.longURL;
    res.redirect('/urls/');
  } else {
    res.statusCode = 403;
    const templateVars = { user: users[req.cookies["user_id"]], message: "403 Forbidden. Please login and try again."};
    res.render('error', templateVars);
  }
});

// Registration page
app.get('/register', (req, res) => {
  if(req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[req.cookies["user_id"]] };
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
  } else if (findUser(email)) {
    // Send 400 error if email already registered
    res.statusCode = 400;
    templateVars.message = "400 Bad Request. Email already registered.";
    res.render('error', templateVars);
  } else {
    const id = generateRandomString();
    users[id] = { id, email, password };
    res.cookie('user_id', id);
    res.redirect('/urls');
  }
});

// Login page
app.get('/login', (req, res) => {
  if(req.cookies["user_id"]) {
    res.redirect('/urls');
  } else {
    const templateVars = { user: users[req.cookies["user_id"]] };
    res.render('login.ejs', templateVars);
  }
});

app.post('/login', (req, res) => {
  const {email, password} = req.body;
  user = findUser(email);
  if(!user || user.password !== password) {
    res.statusCode = 403;
    const templateVars = { user: null, message: "403 Forbidden. Please register first or check your password." };
    res.render('error', templateVars);
  } else {
    res.cookie('user_id', user.id);
    res.redirect('/urls/');
  }
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});