//Generate string of 6 random alphanumeric characters for "unique" shortURL
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
  const templateVars = { user: users[req.cookies["user_id"]], urls: urlDatabase };
  res.render("urls_index", templateVars);
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
    urlDatabase[shortURL] = { longURL: req.body.longURL, userID: shortURL};
    res.redirect(`/urls/${shortURL}`);
  } else {
    res.statusCode = 403;
    res.end("403 Forbidden");
  }
});

app.get("/u/:shortURL", (req, res) => {
  const longURL = urlDatabase[req.params.shortURL].longURL;
  res.redirect(longURL);
});

app.post("/urls/:shortURL/delete", (req, res) => {
  delete urlDatabase[req.params.shortURL];
  res.redirect('/urls/');
});

app.get("/urls/:shortURL", (req, res) => {
  const templateVars = { user: users[req.cookies["user_id"]], shortURL: req.params.shortURL, longURL: urlDatabase[req.params.shortURL].longURL };
  res.render("urls_show", templateVars);
});

app.post("/urls/:shortURL/edit", (req, res) => {
  urlDatabase[req.params.shortURL].longURL = req.body.longURL;
  res.redirect('/urls/');
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
  if(email === "" || password === "") {
    res.statusCode = 400;
    res.end("400 Bad Request");
    console.log("empty");
  } else if (findUser(email)) {
    // Send 400 error if email already registered
    res.statusCode = 400;
    console.log("already registered");
    res.end("400 Bad Request");
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
    res.end("403 Forbidden");
  } else {
    res.cookie('user_id', user.id);
  }
  res.redirect('/urls/');
});

// Logout
app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  res.redirect('/urls/');
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});