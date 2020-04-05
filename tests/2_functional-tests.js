var chaiHttp = require("chai-http");
var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var server = require("../server");
const { Thread } = require("../models");

chai.use(chaiHttp);

suite("Functional Tests", function() {
  var lastId;
  var lastReplyId;

  beforeEach(done => {
    Thread.create(
      {
        text: "Test Text",
        delete_password: "123",
        board: "Test",
        replies: [{ text: "Reply Text", delete_password: "123" }]
      },
      (err, doc) => {
        if (err) return;
        lastId = doc._id;
        lastReplyId = doc.replies[0]._id;
        done();
      }
    );
  });

  after(done => {
    Thread.deleteMany({ board: "Test" }, (err, doc) => {
      if (err) return;
      done();
    });
  });

  suite("API ROUTING FOR /api/threads/:board", function() {
    suite("POST", function() {
      test("POST with required data", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ text: "Test Thread", delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            expect(res).to.redirect;
            done();
          });
      });
      test("POST without text", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "need to specify text and delete password");
            done();
          });
      });
      test("POST without delete password", function(done) {
        chai
          .request(server)
          .post("/api/threads/test")
          .send({ text: "Test Thread" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "need to specify text and delete password");
            done();
          });
      });
    });

    suite("GET", function() {
      test("GET threads of a board", function(done) {
        chai
          .request(server)
          .get("/api/threads/test")
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.isArray(res.body);
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "replies");
            assert.property(res.body[0], "replycount");
            assert.property(res.body[0], "_id");
            done();
          });
      });
    });

    suite("DELETE", function() {
      test("DELETE without thread id", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send()
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "thread not found");
            done();
          });
      });

      test("DELETE without delete password", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: lastId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("DELETE with correct data", function(done) {
        chai
          .request(server)
          .delete("/api/threads/test")
          .send({ thread_id: lastId, delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "sucess");
            done();
          });
      });
    });

    suite("PUT", function() {
      test("PUT without thread id", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send()
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "thread not found");
            done();
          });
      });

      test("PUT with thread id", function(done) {
        chai
          .request(server)
          .put("/api/threads/test")
          .send({ thread_id: lastId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "sucess");
            done();
          });
      });
    });
  });

  suite("API ROUTING FOR /api/replies/:board", function() {
    suite("POST", function() {
      test("POST without text", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send()
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "need to specify text and delete_password");
            done();
          });
      });

      test("POST without delete_password", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({ text: "Test reply" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "need to specify text and delete_password");
            done();
          });
      });

      test("POST without thread_id", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({ text: "Test reply", delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "thread not found");
            done();
          });
      });

      test("POST with correct data", function(done) {
        chai
          .request(server)
          .post("/api/replies/test")
          .send({ text: "Test reply", delete_password: "123" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "thread not found");
            done();
          });
      });
    });

    suite("GET", function() {
      test("GET replies without thread_id", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "thread not found");
            done();
          });
      });

      test("GET replies with fake thread_id", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({ thread_id: "4e8a02c5a6b375473ee73675" })
          .end(function(err, res) {
            assert.equal(res.status, 400);
            assert.equal(res.text, "thread not found");
            done();
          });
      });

      test("GET replies of a thread", function(done) {
        chai
          .request(server)
          .get("/api/replies/test")
          .query({ thread_id: lastId.toString() })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, "text");
            assert.property(res.body, "replies");
            assert.property(res.body, "replycount");
            assert.property(res.body, "_id");
            done();
          });
      });
    });

    suite("PUT", function() {
      test("PUT without data", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .send()
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "thread not found");
            done();
          });
      });

      test("PUT without reply id", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .send({ thread_id: lastId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "reply not found");
            done();
          });
      });
      test("PUT with correct data", function(done) {
        chai
          .request(server)
          .put("/api/replies/test")
          .send({ thread_id: lastId, reply_id: lastReplyId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "sucess");
            done();
          });
      });
    });
    //thread_id, delete_password, reply_id
    suite("DELETE", function() {
      test("DELETE without thread id", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send()
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "thread not found");
            done();
          });
      });

      test("DELETE without reply id", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({ thread_id: lastId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "reply not found");
            done();
          });
      });

      test("DELETE without delete password", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({ thread_id: lastId, reply_id: lastReplyId })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "incorrect password");
            done();
          });
      });

      test("DELETE with correct data", function(done) {
        chai
          .request(server)
          .delete("/api/replies/test")
          .send({
            thread_id: lastId,
            delete_password: "123",
            reply_id: lastReplyId
          })
          .end(function(err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "sucess");
            done();
          });
      });
    });
  });
});
