import {randomUUID} from "crypto";
import {serverBroadcast} from "../config/socket_libs";
import {WebSocketServer} from "ws";

const {WebSocket, WebSocketServer} = require('ws');
const onSocketError = (err) => {
    console.error("Error\t", err);
};
const wss = new WebSocketServer({noServer: true});//https://www.npmjs.com/package/ws

const initSocket = (server) => {
    wss.on('connection', function connection(ws, request, client) {
        //console.log('=================' + `${userid}`);
        //console.log(userid);
        const id = randomUUID();
        clients.set(ws, id);
        console.log(`new connection assigned id: ${id}`);
        ws.on('message', (_response) => {
            let data = {};
            if (isValidJson(_response)) {
                data = JSON.parse(`${_response}`);
            }
            console.log('received: \n', data);

            switch (data.type) {

                case 'join':
                    const userId = data.userId;
                    clients[userId] = ws;
                    console.log(`User ${userId} joined`);
                    serverBroadcast(wss, {
                        type: 'joined',
                        user: `${userId} joined`,
                        userId: `${userId}`
                    });
                    break;

                case 'privateMessage':
                    const recipientId = data.recipientId;
                    const recipientSocket = clients[recipientId];

                    if (recipientSocket) {
                        recipientSocket.send(JSON.stringify({
                            type: 'privateMessage',
                            from: data.from,
                            message: data.message,
                        }));
                        console.log(`Private message sent from ${data.from} to ${recipientId}`);
                    }
                    else {
                        console.log(`Recipient ${recipientId} not found`);
                        serverBroadcast(wss, {
                            error: `Recipient ${recipientId} not found`
                        });
                    }
                    break;

                case 'userList':
                    const userList = Object.keys(clients);
                    console.log(`User list requested: ${userList}`);
                    serverBroadcast(wss, {
                        userList,
                        type: 'userList',
                    });
                    break;

                default:
                    console.log(`Unknown message type: ${data.type}`);
                    serverBroadcast(wss, `Unknown message type: ${data.type}`);
                // console.info('INFO 36 Buffer\t', data);
                // let message = {};
                //
                // if (isValidJson(data)) {
                //     message = JSON.parse(`${data}`);
                //     message["cid"] = clients.get(ws);
                // }
                // else {
                //     console.log('in else');
                //     message["cid"] = clients.get(ws);
                //     message["data"] = `${data}`;
                // }
                //
                // console.log('received: %s', data);
                // // serverBroadcast(`Client ${clients.get(ws)} ${data}`);
                // serverBroadcast(wss, message);
            }
        });

        ws.send(JSON.stringify({
            type: 'userList',
            userList: Object.keys(clients)
        }));


    });


    server.on('upgrade', (req, socket, head) => {
        socket.on('error', onSocketError);
        // This function is not defined on purpose. Implement it with your own logic.
        authenticate(req, client).then((res) => {
            console.log(112, res);
            // console.log("132 request", request);
            // console.log("133 socket", socket);
            console.log("134 head", head);
            socket.removeListener('error', onSocketError);
            wss.handleUpgrade(req, socket, head, (ws) => {

                console.log(115, 'error12');
                wss.emit('connection', ws, req, client);
                // super.handleUpgrade.call(this, req, socket, head);


            });
        }).catch(err => {
            console.log(123, err);
            socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
            socket.destroy();
        });
    });

};

export default initSocket;