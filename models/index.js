const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const replySchema = new Schema({  
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },  
  reported: { type: Boolean, default: false }, 
});


const threadSchema = new Schema({
  board: { type: String, required: true },
  text: { type: String, required: true },
  delete_password: { type: String, required: true },
  created_on: { type: Date, default: Date.now },
  bumped_on: { type: Date, default: Date.now },
  reported: { type: Boolean, default: false },
  replycount: {type: Number, default:0},
  replies: [replySchema]
});


module.exports.Thread = mongoose.model("Thread", threadSchema);
module.exports.Reply = mongoose.model("Reply", replySchema);
