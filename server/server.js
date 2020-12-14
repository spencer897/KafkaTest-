const http = require('http')
const fs = require('fs'); // require file system module  
const express = require('express'); // install express 
const socketio = require('socket.io')
const app = express(); // create an instance of express 
const { Kafka, logLevel } = require('kafkajs'); // install kafkajs
//const server = require('http').createServer(app); // create a server 
//const http = require('http').createServer(app);  // create a second server 
//const websockets = require('socket.io'); // install socket.io 
// const io = websockets(http); // create an instance of websockets 
const { exec } = require('child_process'); // needed to simulate concurrency for websockets; no need to install, bundled with node.js 
// const socketio_port = 3030; // intialize a port on which the server will listen below 

const server = http.createServer(app)
const io = socketio(server)
// Initialize a new connection to the Kafka cluster which lives at port 9092 
const kafka = new Kafka({
  clientId: 'my-app',
  brokers: ['kafka1:9092'],
  connectionTimeout: 3000
})

 // one of the servers is listening on port 44444

// serve main html file to the client for any get requst to the server 
app.get('/', function (req, res) {
    res.sendFile(__dirname + '/index.html'); 
}); 

// opening a connection to the WebSocket server itself 
// upon receiving a connection, the server will start listening
io.on('connection', function(socket){ // have to bounce to ext for now (what does this mean???)
    console.log('connected!')
    // create first kafka consumer  
    // only one consumer per consumer group 
    const consumer_truck_1 = kafka.consumer({ groupId: 'truck1-group' , fromOffset: 0})
    // 
    const run_truck_1 = async () => {
        // save string of name of Kafka topic to a variable 
        const truck_1_topic = 'TRUCK_1_SENSORS'
        // connect to Kafka cluster 
        await consumer_truck_1.connect();
        // find the topic in the cluster and subscribe to it 
        await consumer_truck_1.subscribe({ topic: truck_1_topic });
        // 
        await consumer_truck_1.run({
            // for each message that comes in from Kafka we are going to asynchronously emit the new socket
            // message over socketIO to the client that is connected and pass it the message value
            // we can broadcast that message to any client that is connected to this truck_1's sensor channel 
            // (which matches the truck_1's sensors topic using the message value)
            eachMessage: async ({ topic, partition, message }) => {
                socket.emit(truck_1_topic, `${message.value}`); // send every read message to all the subscribed clients 
                
                io.sockets.emit
                |
                v
                socket.broadcast.emit(truck_1_topic, `${message.value}`); // do we actually need this 

                socket.on('disconnect',()=>{
                  console.log('this guy is gone')
                })
            },
        });
    }

  // invoke the function 
  run_truck_1()
    // catch any errors 
    .catch(e => console.error(`[example/consumer_truck_1] ${e.message}`, e))

  //truck2
  const consumer_truck_2 = kafka.consumer({ groupId: 'truck2-group' , fromOffset: 0})
  const run_truck_2 = async () => {
    const truck_2_topic = 'TRUCK_2_SENSORS'
    await consumer_truck_2.connect();
    await consumer_truck_2.subscribe({ topic: truck_2_topic });
    await consumer_truck_2.run({
        eachMessage: async ({ topic, partition, message }) => {
            // console.log({
            //     key: message.key.toString(),
            //     value: message.value.toString(),
            //     headers: message.headers,
            // })
            socket.emit(truck_2_topic, `${message.value}`);
            socket.broadcast.emit('TRUCK_2_SENSORS', `${message.value}`);
        },
    });
  }

  run_truck_2().catch(e => console.error(`[example/consumer_truck_2] ${e.message}`, e))

  //truck3
  const consumer_truck_3 = kafka.consumer({ groupId: 'truck3-group' , fromOffset: 0})
  const run_truck_3 = async () => {
    const truck_3_topic = 'TRUCK_3_SENSORS'
    await consumer_truck_3.connect();
    await consumer_truck_3.subscribe({ topic: truck_3_topic });
    await consumer_truck_3.run({
        eachMessage: async ({ topic, partition, message }) => {
            // console.log({
            //     key: message.key.toString(),
            //     value: message.value.toString(),
            //     headers: message.headers,
            // })
            socket.emit(truck_3_topic, `${message.value}`);
            socket.broadcast.emit('TRUCK_3_SENSORS', `${message.value}`);
        },
    });
  }

  run_truck_3().catch(e => console.error(`[example/consumer_truck_3] ${e.message}`, e))

  // var pods;
  // var runningpods_arr=[];
  //
  // exec('listpods.sh', (err, stdout, stderr) => {
  //   if (err) {
  //     //some err occurred
  //     console.error(err)
  //     socket.emit('getpods_out', err);
  //   } else {
  //    // the *entire* stdout and stderr (buffered)
  //    console.log(`stdout: ${stdout}`);
  //    pods=`${stdout}`;
  //    var pods_concat=pods.replace(/(?:\r\n|\r|\n)/g,',')
  //    pods_concat=pods_concat.substring(0, pods_concat.length - 1);
  //    console.log('pods_concat',pods_concat)
  //    socket.emit('getpds_out', webcmd_output);
  //    console.log(`stderr: ${stderr}`);
  //    if (stderr) {
  //      console.log(`stderr: ${stderr}`);
  //    }
  //   }
  // });

  var webcmd_output;
  socket.on('webcmd', function(webcmd, callback) {
    exec(webcmd, (err, stdout, stderr) => {
      if (err) {
        //some err occurred
        console.error('got an error',err)
        socket.emit('webcmd_out', err);
      } else {
         // the *entire* stdout and stderr (buffered)
         console.log(`stdout: ${stdout}`);
         webcmd_output=`${stdout}`;
         socket.emit('webcmd_out', webcmd_output);
         console.log(`stderr: ${stderr}`);
         // if (stderr) {
         //   socket.emit('webcmd_out', `stderr: ${stderr}`);
         // }
      }
    });
      console.log(webcmd)
  })

  socket.on('sendcmd_btn', function(data, callback) {
    if (data==='startproduce') {
      exec('start_truck_sensors.sh', (err, stdout, stderr) => {
        if (err) {
          //some err occurred
          console.error(err)
        } else {
         // the *entire* stdout and stderr (buffered)
         console.log(`stdout: ${stdout}`);
         if (stderr) {
           //socket.emit('webcmd_out', `stderr: ${stderr}`);
         }
        }
      });
    } else if (data==='stopproduce') {
      exec('stop_truck_sensors.sh', (err, stdout, stderr) => {
        if (err) {
          //some err occurred
          console.error(err)
          //socket.emit('webcmd_out', err);
        } else {
         // the *entire* stdout and stderr (buffered)
         console.log(`stdout: ${stdout}`);
         //webcmd_output=`${stdout}`;
         //socket.emit('webcmd_out', webcmd_output);
         console.log(`stderr: ${stderr}`);
         if (stderr) {
           //socket.emit('webcmd_out', `stderr: ${stderr}`);
         }
        }
      });
    } else if (data==='killkafka1') {
      exec('killkafka1.sh', (err, stdout, stderr) => {
        if (err) {
          //some err occurred
          console.error(err)
          //socket.emit('webcmd_out', err);
        } else {
         // the *entire* stdout and stderr (buffered)
         console.log(`stdout: ${stdout}`);
         //webcmd_output=`${stdout}`;
         //socket.emit('webcmd_out', webcmd_output);
         console.log(`stderr: ${stderr}`);
         if (stderr) {
           //socket.emit('webcmd_out', `stderr: ${stderr}`);
         }
        }
      });
    }
  })
  // socket.on('stopproduce', function(data, callback) {
  //
  // })
});

//Express Web Endpoints / REST API's
// http.listen(socketio_port, function(){
//   console.log('listening on *:'+socketio_port);
// });

const errorTypes = ['unhandledRejection', 'uncaughtException']
const signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2']

errorTypes.map(type => {
  process.on(type, async e => {
    try {
      console.log(`process.on ${type}`)
      console.error(e)
      await consumer.disconnect()
      process.exit(0)
    } catch (_) {
      process.exit(1)
    }
  })
})

signalTraps.map(type => {
  process.once(type, async () => {
    try {
      await consumer.disconnect()
    } finally {
      process.kill(process.pid, type)
    }
  })
})

server.on('error', (err)=>{
  console.log(err)
})

server.listen(8080, ()=>{
  console.log('server listening on 8080')
});
// const httpServer = require("http").createServer();
// const io = require("socket.io")(httpServer, {
//   // ...
// });

// io.on("connection", (socket) => {
//   // ...
// });

// httpServer.listen(3000);

//Express Web Endpoints / REST API's
// http.listen(socketio_port, function(){
//   console.log('listening on *:'+socketio_port);
// });
