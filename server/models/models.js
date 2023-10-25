const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  name: String,
  email: String,
  password: String, 
});

userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const questionSchema = new Schema({
  title: String,
  content: String,
  category: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  answers: [{
    type: Schema.Types.ObjectId,
    ref: 'Answer'
  }],
});

const answerSchema = new Schema({
  content: String,
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  question: {
    type: Schema.Types.ObjectId,
    ref: 'Question'
  },
});

const User = mongoose.model('User', userSchema);
const Question = mongoose.model('Question', questionSchema);
const Answer = mongoose.model('Answer', answerSchema);

module.exports = {
  User,
  Question,
  Answer
};