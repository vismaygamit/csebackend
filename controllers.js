const mongoose = require('mongoose');
const models = require('./models');
const operationalTransformation = require('./operationalTransformation');

const Mutation = mongoose.model('Mutation', models.mutationSchema);
const Conversation = mongoose.model('Conversation', models.conversationSchema);

const ping = (req, res) => {
  res.status(200).send({
    'ok': true,
    'msg': 'pong'});
};

const getInfo = (req, res) => {
    res.status(200).send({
      'ok': true,
      'author': {
        'email': 'vismaygamit16@gmail.com',
        'name': 'Vismay Gamit'
      },
      'frontend': {
        'url': ''
      },
      'language': 'node.js',
      'sources': 'https://ces-vismay.herokuapp.com/',
      'answers': {
        '1': "My approach started with drawing out how I believed the algorithm should work and breaking it down into cases based on the examples. I used that to design and implement the database schema which I chose to do in MongoDB because it is flexible and easy to change the schema if needed. I decided to tackle the insert case first and started with implementing the backend because I'm applying for the Full-Stack/Backend Engineer role and backend interests me more..",
        '2': 'If I had more time, I would add support for the delete and insert with conflict cases. I would learn about serverless frameworks and implement one, because I think that my solution has scalability concerns. I would add security, probably with JSON Web Tokens and bcrypt, so that only authorized users could access the endpoints.',
        '3': "I found this challenge to be an incredibly interesting puzzle, and I enjoyed working on it. I just wish that I had more time to finish. So if I were to add something to this challenge, it would be more time to work on it."
      }
    });
};

const postMutation = (req, res) => {
  if(!req.body.conversationId){  
    const data={
      text:req.body.text,
      author:req.body.author,
      lastMutation:{
        type:"insert",
        index:req.body.text.length-1,
        length:req.body.text.length,
        text:req.body.text
      },
      origin:{
        alice:0,
        bob:0
      }
    }
    var newConversation = new Conversation(data);
    newConversation.save((error, doc) => {
      if(error){
        // res.status(400).send(error);
        console.log(error);
      } else {
        // res.status(201).send(doc);
        res.status(201).send({
          'msg': 'Conversation created and mutation applied',
          'ok': true,
          'text': doc.text
        })
      }
    });
  } else {
    updateConversation(req.body.conversationId, req, res);
  }
};

const updateConversation = (id, req, res) => {
  Conversation.findById(id, (error, docs) => {
    if(error){
      res.send(error);
    } else {
      let insertMutation = operationalTransformation.performInsert(docs.text, req.body.index, req.body.author, req.body.text);
      let updateState =
      Conversation.updateOne({_id: id}, {text: insertMutation}, (error, doc) => {
        if(error){
          console.log(error);
        } else {
          console.log(doc);
        };
      });
      let findType = req.body.text.length;
      // let determineType = findType ? 'insert' : 'delete';
      let determineType = 'insert';
      let origin = operationalTransformation.getOrigin();
      createMutation(req, res, determineType, origin, id);
    };
  });
};

const createMutation = (req, res, type, origin,id) => {
  console.log("create mutation");
  let newMutation = new Mutation({
      author: req.body.author,
      origin:{
        alice:origin[1],
        bob:origin[0]
      },
      conversationId: id,
      // conversationId: req.body.conversationId,
      data:{
        type:type,
        index:req.body.text.length-1,
        length:req.body.text.length,
        text:req.body.text
      }  
  });
  newMutation.save((error, doc) => {
    if(error){
      res.status(400).send(error);
    } else {
      // res.status(201).send(doc);
      getConversation(req, res);
    };
  });
};

console.log("get ss");

const getConversations = (req, res) => {
  console.log("get");
  Conversation.find({}, (error, conversations) => {
    if(error){
      res.status(400).send(error);
    } else {
      // console.log(conversations);
      res.status(200).send(conversations);
    };
  });
};

console.log("get ss1");


const getConversation = (req, res) => {
  let id = req.params.conversationId || req.body.conversationId;
  Conversation.findById(id, (error, doc) => {
    if(error){
      res.status(400).send(error);
    } else {
      console.log(doc);
      res.status(201).send({
        'msg': 'Mutation applied to conversation',
        'ok': true,
        'text': doc.text
      });
    };
  });
};

const deleteConversation = (req, res) => {
  Conversation.findByIdAndDelete(req.body.id, (error, docs) => {
    if(error){
      res.status(400).send(error);
    } else {
      console.log(req.body.id)
      res.status(204).json({ msg: 'message', ok: true })
    };
  });
};

module.exports.ping = ping;
module.exports.getInfo = getInfo;
module.exports.postMutation = postMutation;
module.exports.getConversation = getConversation;
module.exports.getConversations = getConversations;
module.exports.deleteConversation = deleteConversation;
