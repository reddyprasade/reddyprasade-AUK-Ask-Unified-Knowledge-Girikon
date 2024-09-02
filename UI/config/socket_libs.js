const WebSocket = require("ws");

const serverBroadcast = (wss, message) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
        }
    });
};

module.exports = {
    serverBroadcast
};