const passport = require("passport");
var express = require("express");
const client = require("./client");
var router = express.Router();
var jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

router.post("/login", (req, res) => {
    passport.authenticate("local", { session: false }, async (err, user, info) => {
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (err) {
            return res.status(404).json({ message: err });
        }
        req.login(user, { session: false }, (err) => {
            if (err) res.send(err);
            const token = jwt.sign(user, "secret");
            return res.json({ token });
        });

    })(req, res);
});

router.post("/register", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const users = db.collection("reddit_user");

        const emailExists = await users.findOne({ email: req.body.email });
        if (emailExists) {
            return res.status(403).send("User with that email already exists");
        }

        const usernameExists = await users.findOne({ username: req.body.username });
        if (usernameExists) {
            return res.status(403).send("User with that username already exists");
        }

        const hashedPassword = await bcrypt.hash(req.body.password, 10); 

        await users.insertOne({
            username: req.body.username,
            password: hashedPassword,
            email: req.body.email
        });

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.status(500).send("There was a problem registering the user.");
    } finally {
        await client.close();
    }
});

module.exports = router;
