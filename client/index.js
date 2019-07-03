// Import from the module './whiteboard':
//   The default export, naming it draw,
//   An export named `events`, calling it `whiteboard`.
import whiteboard, {draw} from './whiteboard'

// import createClientSocket from 'socket.io.client';
// const clientSocket = createClientSocket(window.location.origin);

const socket = io(window.location.origin);
const drawingName = window.location.pathname;

socket.on('connect', () => {
    console.log("I have made a persistent two-way connection to the server!");
    socket.emit('join-drawing', drawingName);

})

socket.on('replay-drawing', instructions => {
    instructions.forEach(instruction => {
        draw(...instruction, false);
    })
})

socket.on('drawReceived', (start, end, color) => {
    draw(start, end, color, false);
})

whiteboard.on('draw', (start, end, color) => {
    socket.emit('drawSend', drawingName, start, end, color);
})
