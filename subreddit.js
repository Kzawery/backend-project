var express = require('express');
var router = express.Router();


router.post("/create", async (req, res) => {
    try {
        const db = req.dbClient.db("admin");
        const subreddits = db.collection("subreddit");
        const subredditModerators = db.collection("subreddit_moderator");

        const existingSubreddit = await subreddits.findOne({ name: req.body.subname });
        if (existingSubreddit) {
            res.sendStatus(409);
            return;
        }

        const newSubreddit = {
            name: req.body.subname,
            description: req.body.description
        };
        const result = await subreddits.insertOne(newSubreddit);

        await subredditModerators.insertOne({
            user_id: req.user._id,
            subreddit_id: result.insertedId
        });

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});


router.post("/join", async (req, res) => {
    try {

        const db = req.dbClient.db("admin");
        const subreddits = db.collection("subreddit");
        const subredditUsers = db.collection("subreddit_user");

        const subreddit = await subreddits.findOne({ name: req.body.subname });
        if (!subreddit) {
            res.sendStatus(404);
            return;
        }
        const existingRecord = await subredditUsers.findOne({ user_id: req.user._id, subreddit_id: subreddit._id });
        console.log(`{ user_id: ${req.user._id}, subreddit_id: ${subreddit._id} }`
        )
        if (existingRecord) {
            res.status(409).send("You are already a part of this subreddit.");
        } else {
            await subredditUsers.insertOne({
                user_id: req.user._id,
                subreddit_id: subreddit._id
            });
            res.sendStatus(200);
        }

    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

router.post("/leave", async (req, res) => {
    try {

        const db = req.dbClient.db("admin");
        const subreddits = db.collection("subreddit");
        const subredditUsers = db.collection("subreddit_user");

        const subreddit = await subreddits.findOne({ name: req.body.subname });
        if (!subreddit) {
            res.sendStatus(404);
            return;
        }

        const existingRecord = await subredditUsers.findOne({ user_id: req.user._id, subreddit_id: subreddit._id });
        console.log(`{ user_id: ${req.user._id}, subreddit_id: ${subreddit._id} }`

        )
        if (!existingRecord) {
            res.status(409).send("You are not a part of this subreddit. \nHow did you get here? ;)"); // 409 Conflict
        } else {

            await subredditUsers.deleteOne({
                user_id: req.user._id,
                subreddit_id: subreddit._id
            });

            res.status(200).send("You are no longer a part of this subreddit.");
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

router.put(`/edit/:subname`, async (req, res) => {
    try {

        const db = req.dbClient.db("admin");
        const subreddits = db.collection("subreddit");

        await subreddits.updateOne(
            { name: req.params.subname },
            { $set: { description: req.body.description } }
        );

        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

router.get(`/:subname`, async (req, res) => {
    try {
        const db = req.dbClient.db("admin");
        const subreddits = db.collection("subreddit");

        const subreddit = await subreddits.findOne({ name: req.params.subname });
        if (!subreddit) {
            res.sendStatus(404);
            return;
        }

        res.status(200).send(subreddit);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    }
});

module.exports = router;
