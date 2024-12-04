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
const insertDevice_info = (socket_id, device_info) => {
  database_soc_ids.forEach((soc_id) => {
    if(soc_id.user_socket_id == socket_id){
      soc_id.device_info = device_info;
    }
  });
}

const removeDatabase_soc_ids = (socket_id) => {
  database_soc_ids = database_soc_ids.filter((soc_id) => {
    return soc_id.user_socket_id != socket_id;
  });
}
// check connection on namespace /admin
const admin = io.of('/admin');
io.on('connection', (socket) => {
    socket_id = socket.id;
    
  console.log(socket_id+' user connected');
  // socket.emit("query", "SELECT * FROM Users");
  socket.on('register_user_device', (data) => {
    let res = data;
    database_soc_ids.push({
      user_socket_id: socket_id,
      device_info: res
    });
    console.log(socket_id+' register_user_device: '+JSON.stringify(res));
    admin.emit('list_devices', database_soc_ids);
  });

  socket.on('query_result', (data) => {
    let res = JSON.stringify(data);
    console.log(socket_id+' query_result: '+res);
    admin.emit('perform_query_result', res);
  });

  // on disconnect
  socket.on('disconnect', (socket) => {
    console.log(socket_id+' user disconnected');
    removeDatabase_soc_ids(socket_id);
    admin.emit('list_devices', database_soc_ids);
  });


});

admin.on('connection', (Adminsocket) => {
  console.log('admin connected');
  admin.emit('list_devices', database_soc_ids);
  Adminsocket.on('perform_query', (query) => {
    console.log('admin perform_query: '+query);
    io.emit('query', query);
  });

  Adminsocket.on('disconnect', () => {
    console.log('admin disconnected');
  });
});

server.listen(port,ip, () => {
  console.log(`server running at http://${ip}:${port}/`);
});