const express = require('express');

const socketio = require('socket.io');
const http = require('http');
const { addUser, removeUser, getUser, getUsersInRoom } = require('./users');
const PORT = process.env.PORT || 5000;
const formatMessage = require('./utils/messages');
const router = require('./router');
const app = express();
const server = http.createServer(app);
const io = socketio(server);
const cors = require('cors');
const botName = 'ChatBot TT';

io.on('connection', socket => {
  socket.on('join', ({ name, room }, callback) => {
    const { error, user } = addUser({ id: socket.id, name, room });

    if (error) return callback(error);

    //Welcome current user
    socket.emit('message', formatMessage(botName, 'Welcome to Team Talk !'));
    socket.broadcast
      .to(user.room)
      .emit(
        'message',
        formatMessage(botName, `${user.name} has joined the chat`)
      );

    socket.join(user.room);

    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('sendMessage', (message, callback) => {
    const user = getUser(socket.id);
    console.log(socket.id);
    console.log(user);

    io.to(user.room).emit('message', formatMessage(`${user.name}`, message));
    io.to(user.room).emit('roomData', {
      room: user.room,
      users: getUsersInRoom(user.room)
    });

    callback();
  });

  socket.on('disconnect', () => {
    const user = removeUser(socket.id);

    if (user) {
      io.to(user.room).emit('message', {
        user: 'admin',
        text: `${user.name} has left the chat`
      });
    }
  });
});

app.use(router);
app.use(cors());

server.listen(PORT, () => console.log(`Server has started on port ${PORT}`));
