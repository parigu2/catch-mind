const path = require('path')
const express = require('express')
const app = express()
const socketio = require('socket.io');

// app.listen() returns an http.Server object
// http://expressjs.com/en/4x/api.html#app.listen
const server = app.listen(1337, () => {
  console.log(`Listening on http://localhost:${server.address().port}`)
})

const io = socketio(server);

const drawings = {};
const connections = {};

function getDrawing (drawingName) {
  if (drawings[drawingName] === undefined) {
    drawings[drawingName] = {
      connection: 0,
      pen: []
    }
  }
  return drawings[drawingName];
}

function joinRoom(drawingName, socketId) {
  connections[socketId] = drawingName
  drawings[drawingName].connection++;
}

function leaveRoom (socketId) {
  const drawingName = connections[socketId];
  delete connections[socketId]
  const remaining = --drawings[drawingName].connection;
  if(!remaining) {
    drawings[drawingName].pen = []
  }
}

io.on('connection', socket => {
  console.log('A new client has connected!');
  console.log(socket.id);
  
  socket.on('join-drawing', drawingName => {
    socket.join(drawingName);
    const drawing = getDrawing(drawingName)
    joinRoom(drawingName, socket.id)
    socket.emit('replay-drawing', drawing.pen);
  })

  socket.on('drawSend', (drawingName, start, end, color) => {
    const drawing = getDrawing(drawingName)
    drawing.pen.push([start, end, color]);
    // socket.broadcast.emit('drawReceived', start, end, color);
    socket.broadcast.to(drawingName).emit('drawReceived', start, end, color);
  })

  socket.on('disconnect', () => {
    console.log('Disconnected :<', socket.id);
    leaveRoom(socket.id)
    io.emit('user disconnected');
  })
})

app.get('/', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'public', 'main.html'));
  console.log(drawings)
})

app.use(express.static(path.join(__dirname, 'public')))

app.get('/:number', (req, res, next) => {
  const drawingName = `/${req.params.number}`
  if(drawings[drawingName] !== undefined) {
    if(drawings[drawingName].connection > 3) {
      res.redirect('/')
    } else {
      res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
  } else {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  }
})