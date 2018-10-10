const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const session = require('express-session');
const Sequelize = require('sequelize');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const bcrypt = require('bcrypt');

//get the css files
app.use(express.static('public'));

//set ejs
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({ extended: false }));

//db config
const sequelize = new Sequelize({
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  host: process.env.DB_HOST,
  dialect: 'postgres',
  storage: './session.postgres',
});

app.use(
  session({
    store: new SequelizeStore({
      db: sequelize,
      checkExpirationInterval: 15 * 60 * 1000, // The interval at which to cleanup expired sessions in milliseconds.
      expiration: 24 * 60 * 60 * 1000, // The maximum age (in milliseconds) of a valid session.
    }),
    secret: 'this is secret',
    saveUninitialized: true,
    resave: false,
  })
);

//defining the User model
const User = sequelize.define(
  'users',
  {
    fistname: {
      type: Sequelize.STRING,
    },
    lastname: {
      type: Sequelize.STRING,
    },
    email: {
      type: Sequelize.STRING,
      unique: true,
    },
    password: {
      type: Sequelize.STRING,
      unique: true,
    },
    phone: {
      type: Sequelize.STRING,
    },
    country: {
      type: Sequelize.STRING,
    },

  {
    timestamps: false,
  }
);

app.get('/', (req, res) => {
  res.render('login');
});

//signup route
app.get('/signup', (req, res) => {
  res.render('signup');
});

//post request signup
app.post('/signup', (req, res) => {
  //all fields are required
  if (!req.body.fname || !req.body.lname || !req.body.email || !req.body.sign-password || !req.body.phone-number || !req.body.country) {
    res.redirect(
      '/signup?error=' + encodeURIComponent('All fields are required')
    );
  }
  //find a user with that username
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then(user => {
      //if username is already taken, then send an error
      if (user) {
        return res.redirect(
          '/signup?error=' + encodeURIComponent('That email has been already taken')
        );
      }
    })
    .catch(err => {
      console.log(err);
    });

  const password = req.body.sign-password;
  bcrypt
    .hash(password, 8)
    .then(hash => {
      return User.create({
        //populate the user table using an encrypted password
        firstname:req.body.fname,
        lastname:req.body.lname,
        email: req.body.email,
        password: hash,
        phone:req.body.phone-number,
        country: req.body.country
      });
    })
    .then(user => {
      req.session.user = user;

      res.redirect('/profile');
    })
    .catch(err => {
      console.log(err);
    });
});

//logout route
app.get('/logout', (req, res) => {
  req.session.destroy(error => {
    if (error) {
      throw error;
    }
    res.redirect('/?message=' + encodeURIComponent('You are logged out.'));
  });
});

sequelize
  .sync()
  .then(() => {
    const server = app.listen(3000, () => {
      console.log('App listening on port: ' + server.address().port);
    });
  })
  .catch(error => console.log('This error occured', error));
