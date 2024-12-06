const WebSocket = require('ws');
const server = new WebSocket.Server({ port: 3000 });

let clients = [];

server.on('connection', (socket) => {
    clients.push(socket);

    socket.on('message', (message) => {
        const data = JSON.parse(message);

        // Broadcast signaling data to another random client
        clients.forEach((client) => {
            if (client !== socket && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(data));
            }
        });
    });

    socket.on('close', () => {
        clients = clients.filter((client) => client !== socket);
    });
});

console.log('WebSocket server running on ws://localhost:3000');