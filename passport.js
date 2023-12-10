const passport = require("passport"),
      LocalStrategy = require("passport-local").Strategy;
const { MongoClient } = require('mongodb');
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const bcrypt = require('bcrypt');

// Assuming you have a MongoDB client set up and connected
const client = require('./client');

passport.initialize();

passport.use(
  new LocalStrategy({}, async function (username, password, done) {
    try {
      await client.connect();
      const db = client.db("admin");
      const users = db.collection("reddit_user");

      const user = await users.findOne({ username: username });

      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      // Assuming bcrypt is used for password hashing
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (error) {
      return done(error);
    } finally {
      await client.close();
    }
  })
);

passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
      secretOrKey: "secret",
    },
    async (jwtPayload, cb) => {
      try {
        await client.connect();
        const db = client.db("admin");
        const users = db.collection("reddit_user");

        const user = await users.findOne({ username: jwtPayload.username });

        if (!user) {
          return cb("Invalid username or password");
        }

        const match = jwtPayload.password === user.password
        
        if (!match) {
          return cb("Invalid username or password");
        }

        return cb(null, user);
      } catch (error) {
        return cb(error);
      } finally {
        await client.close();
      }
    }
  )
);

module.exports = passport;
