const express = require('express'); // install express 
const app = express(); // create an instance of express 
const { Kafka, logLevel } = require('kafkajs'); // install kafkajs
const server = require('http').createServer(app);
const http = require('http').createServer(app);
const websockets = require('socket.io'); // install socket.io 
const io = websockets(http); // create and instance of websockets 
const { exec } = require('child_process') // no need to install, bundled with node.js 

// const httpServer = require("http").createServer();
// const io = require("socket.io")(httpServer, {
//   // ...
// });

// io.on("connection", (socket) => {
//   // ...
// });

// httpServer.listen(3000);