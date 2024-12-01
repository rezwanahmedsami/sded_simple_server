const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');

const port = process.env.PORT || 3000;
const ip = process.env.IP || '192.168.0.106';

const app = express();
const server = createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});
var socket_id = 0;
var database_soc_ids = [];
// check connection on namespace /admin
const admin = io.of('/admin');
io.on('connection', (socket) => {
    socket_id = socket.id;
    database_soc_ids.push(socket_id);
  console.log(socket_id+' user connected');

  socket.emit("query", "SELECT * FROM Users");

  socket.on('query_result', (data) => {
    let res = JSON.stringify(data);
    console.log(socket_id+' query_result: '+res);
    admin.emit('perform_query_result', res);
  });


});

admin.on('connection', (socket) => {
  console.log('admin connected');
  socket.on('perform_query', (query) => {
    console.log('admin perform_query: '+query);
    io.emit('query', query);
  });

  socket.on('disconnect', () => {
    console.log('admin disconnected');
  });
});
// on disconnect
io.on('disconnect', (socket) => {
  console.log(socket_id+' user disconnected');
});

server.listen(port,ip, () => {
  console.log(`server running at http://${ip}:${port}/`);
});