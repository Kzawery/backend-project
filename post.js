var express = require('express');
var router = express.Router();

const client = require('./client')

router.get("/", async (req, res) => {
    const index = parseInt(req.query.page) * 10;
    let sortOption = { creation_date: -1 };
    if(req.query.sort === 'best') {
        sortOption = { votes: -1 };
    }

    try {
        await client.connect();
        const db = client.db("admin");
        const posts = db.collection("post");

        // Additional filtering based on subreddit if provided
        let filter = {};
        if (req.query.subname) {
            filter['subreddit.name'] = req.query.subname;
        }

        const resp = await posts.aggregate([
            { $match: filter },
            { $lookup: { from: 'subreddit', localField: 'subreddit_id', foreignField: 'id', as: 'subreddit' } },
            { $lookup: { from: 'reddit_user', localField: 'user_id', foreignField: 'id', as: 'user' } },
            { $lookup: { from: 'post_vote', localField: 'id', foreignField: 'post_id', as: 'votes' } },
            { $sort: sortOption },
            { $skip: index },
            { $limit: 10 },
            { $project: { /* Define fields to return here */ } }
        ]).toArray();

        res.send(resp);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});

router.post("/", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const posts = db.collection("post");
        const subreddit = db.collection("subreddit");

        const subredditDoc = await subreddit.findOne({ name: req.body.subreddit });
        if (!subredditDoc) {
            res.status(404).send("Subreddit not found");
            return;
        }

        const newPost = {
            title: req.body.title,
            content: req.body.content,
            creation_date: new Date(),
            subreddit_id: subredditDoc._id,
            user_id: req.user.id,
            video_url: req.body.link,
            // image_path can be added if needed
        };

        const result = await posts.insertOne(newPost);
        res.status(200).send({ id: result.insertedId });
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});

router.get("/:id", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const posts = db.collection("post");

        const postId = req.params.id;
        const resp = await posts.aggregate([
            { $match: { id: postId } },
            { $lookup: { from: 'subreddit', localField: 'subreddit_id', foreignField: 'id', as: 'subreddit' } },
            { $lookup: { from: 'reddit_user', localField: 'user_id', foreignField: 'id', as: 'user' } },
            { $lookup: { from: 'post_vote', localField: 'id', foreignField: 'post_id', as: 'votes' } },
            { $project: { /* Define fields to return here */ } }
        ]).toArray();

        if (resp.length === 0) {
            res.sendStatus(404);
        } else {
            res.send(resp[0]);
        }
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});


router.post("/upvote/:id", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("admin");
        const postVotes = db.collection("post_vote");

        const filter = { post_id: req.params.id, user_id: req.user.id };
        const update = { $set: { vote: 1 } };
        const options = { upsert: true };

        await postVotes.updateOne(filter, update, options);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});

router.post("/downvote/:id", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("your_database_name");
        const postVotes = db.collection("post_vote");

        const filter = { post_id: req.params.id, user_id: req.user.id };
        const update = { $set: { vote: -1 } };
        const options = { upsert: true };

        await postVotes.updateOne(filter, update, options);
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});

router.post("/delete", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("your_database_name");
        const posts = db.collection("post");

        // Perform necessary checks for subreddit moderator here
        // ...

        await posts.deleteOne({ id: req.body.id });
        res.sendStatus(200);
    } catch (err) {
        console.log(err);
        res.sendStatus(500);
    } finally {
        closeConnection();
    }
});


module.exports = router;
