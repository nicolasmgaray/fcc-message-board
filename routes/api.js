"use strict";
const mongoose = require("mongoose");
const { Thread } = require("../models");

module.exports = async app => {
  await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true });

  /////////////////////////////////// THREADS ///////////////////////////////////

  // GET - THREADS

  app.route("/api/threads/:board").get(async (req, res) => {
    const { board } = req.params;

    // Query and send
    let docs = await Thread.find({ board: board })
      .slice("replies", -3)
      .select(
        "-delete_password -reported -replies.reported -replies.delete_password"
      )
      .sort("-bumped_on")
      .limit(10)
      .exec();

    res.json(docs);
  });

  // POST - THREADS

  app.route("/api/threads/:board").post(async (req, res) => {
    const { text, delete_password } = req.body;
    const { board } = req.params;

    // Missing arguments
    if (!text || !delete_password)
      return res.status(400).send("need to specify text and delete password");

    // Create and redirect
    await Thread.create({ text, delete_password, board });
    res.redirect(`/b/${board}`);
  });

  // DELETE - THREADS
  app.route("/api/threads/:board").delete(async (req, res) => {
    const { thread_id, delete_password } = req.body;

    // Query the thread
    let doc = await Thread.findById(thread_id)
      .select("delete_password")
      .exec();

    // Not found or incorrect password
    if (!doc) res.send("thread not found");
    if (doc.delete_password != delete_password)
      return res.send("incorrect password");

    // Delete and send success
    let result = await Thread.findByIdAndDelete(thread_id).exec();
    res.send("sucess");
  });

  // PUT - THREADS
  app.route("/api/threads/:board").put(async (req, res) => {
    const { thread_id } = req.body;

    // TRY TO MAKE THE UPDATE
    let doc = await Thread.findByIdAndUpdate(thread_id, {
      reported: true
    }).exec();

    // IF NOTHING CHANGED, THREAD NOT FOUND
    if (!doc) return res.send("thread not found");

    // OTHERWISE SUCESS
    res.send("sucess");
  });

  /////////////////////////////////// REPLIES ///////////////////////////////////

  // REPLIES - POST

  app.route("/api/replies/:board").post(async (req, res) => {
    const { text, delete_password, thread_id } = req.body;
    const { board } = req.params;

    // MISSING ARGUMENTS
    if (!text || !delete_password)
      return res.status(400).send("need to specify text and delete_password");

    // FIND AND UPDATE THE DOC PUSHING A NEW REPLY
    let docs = await Thread.findByIdAndUpdate(thread_id, {
      bumped_on: Date.now(),
      $inc: { replycount: 1 },
      $push: { replies: { text, delete_password, board } }
    }).exec();

    // IF NOTHING CHANGED, THREAD NOT FOUND
    if (!docs) return res.status(400).send("thread not found");

    // REDIRECT ON SUCCESS
    res.redirect(`/b/${board}/${thread_id}`);
  });

  // REPLIES - GET

  app.route("/api/replies/:board").get(async (req, res) => {
    const { thread_id } = req.query;

    // QUERY THE THREAD
    let doc = await Thread.findOne({ _id: thread_id })
      .select(
        "-delete_password -reported -replies.reported -replies.delete_password"
      )
      .sort("-bumped_on")
      .exec();

    // IF NOTHING RETURNED, THREAD NOT FOUND
    if (!doc) return res.status(400).send("thread not found");

    // OTHERWISE SEND THE DOC
    res.json(doc);
  });

  // REPLIES - DELETE

  app.route("/api/replies/:board").delete(async (req, res) => {
    const { thread_id, delete_password, reply_id } = req.body;

    // FIND THE THREAD
    let doc = await Thread.findById(thread_id).exec();

    // IF NOT FOUND, SEND ERROR
    if (!doc) return res.send("thread not found");

    // IF FOUND, SEARCH REPLY
    let replyIndex = doc.replies.findIndex(x => x._id == reply_id);
    
    // IF REPLY NOT FOUND, SEND ERROR
    if (replyIndex < 0) return res.send("reply not found");
    
    // IF FOUND CHECK THE PASSWORD, IF INCORRECT, SEND ERROR
    if (doc.replies[replyIndex].delete_password != delete_password)
      return res.send("incorrect password");

    // IF CORRECT, UPDATE THE TEXT TO DELETE IT AND UPDATE THE DB WITH THE NEW REPLIES ARRAY
    doc.replies[replyIndex].text = "[deleted]";
    await Thread.findByIdAndUpdate(thread_id, { replies: doc.replies });

    // SEND SUCCESS
    res.send("sucess");
  });

  // PUT - REPLIES

  app.route("/api/replies/:board").put(async (req, res) => {
    const { thread_id, reply_id } = req.body;

    // FIND THREAD
    let doc = await Thread.findById(thread_id).exec();

    // IF NOT FOUND, SEND ERROR
    if (!doc) return res.send("thread not found");

    // FIND REPLY
    let replyIndex = doc.replies.findIndex(x => x._id == reply_id);

    // IF NOT FOUND, SEND ERROR
    if (replyIndex < 0) return res.send("reply not found");

    // IF FOUND, CHANGED REPORTED STATUS AND UPDATE THE DB WITH THE NEW REPLIES ARRAY
    doc.replies[replyIndex].reported = true;
    await Thread.findByIdAndUpdate(thread_id, { replies: doc.replies });

    // SEND SUCCESS
    res.send("sucess");
  });

  //404 Not Found Middleware
  app.use(function(req, res, next) {
    res
      .status(404)
      .type("text")
      .send("Not Found");
  });
};
