var express = require('express');
var router = express.Router();
const client = require('./client')

async function closeConnection() {
    try {
        await client.close();
    } catch (error) {
        console.error('Error closing MongoDB client:', error);
    }
}

router.get("/", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const users = db.collection("reddit_user");
        const resp = await users.find().limit(10).toArray();
        res.send(resp);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});

router.post("/deleteaccount/", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const users = db.collection("reddit_user");

        const user = await users.findOne({ id: req.user.id, password: req.body.password });
        if (!user) {
            res.sendStatus(403);
            return;
        }

        await users.deleteOne({ id: req.user.id });
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});

router.post("/changepassword/", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const users = db.collection("reddit_user");

        const updateResult = await users.updateOne(
            { id: req.user.id, password: req.body.currentpassword },
            { $set: { password: req.body.newpassword } }
        );

        if (updateResult.modifiedCount === 0) {
            res.sendStatus(403);
        } else {
            res.sendStatus(200);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});

router.get("/subreddit/:name", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const subredditUser = db.collection("subreddit_user");

        const resp = await subredditUser.aggregate([
            { $match: { 'subreddit.name': req.params.name, user_id: req.user.id } },
            { $lookup: { from: 'subreddit', localField: 'subreddit_id', foreignField: 'id', as: 'subreddit_info' } }
        ]).toArray();

        res.send(resp);
    } catch (err) {
        console.log(err);
        res.sendStatus(403);
    } finally {
        closeConnection();
    }
});

module.exports = router;
