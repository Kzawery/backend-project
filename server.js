const express = require('express');
const cors = require('cors');
const passport = require('./passport');
const { MongoClient } = require('mongodb');
const client = new MongoClient("mongodb://localhost:27017", { useNewUrlParser: true, useUnifiedTopology: true });

var authRouter = require('./auth');
var userRouter = require('./user');
var postRouter = require('./post');
var subredditRouter = require('./subreddit');

client.connect()
    .then(() => {

        const app = express();

        app.use((req, res, next) => {
            req.dbClient = client;
            next();
        });

        app.use(cors());
        app.use(express.json());
        app.use(express.urlencoded({ extended: false }));

        app.use('/auth', authRouter);
        app.use('/users', passport.authenticate("jwt", { session: false }), userRouter);
        app.use('/posts', passport.authenticate("jwt", { session: false }), postRouter);
        app.use('/subreddits', passport.authenticate("jwt", { session: false }), subredditRouter);

        const PORT = process.env.PORT || 3000;
        const server = app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}.`);
        });
    })
    .catch(err => console.error('Failed to connect to MongoDB', err));
