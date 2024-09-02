# Create a self-signed certificate for localhost with Node.js and OpenSSL
```bash
echo "Creating root server"
openssl genrsa -out root.key 2048
openssl req -x509 -new -nodes -key root.key -sha256 -days 365 -out root.crt

echo "Creating server certificate"
openssl genrsa -out server.key 2048
openssl req -new -key server.key -out server.csr
openssl x509 -req -in server.csr -CA root.crt -CAkey root.key -CAcreateserial -out server.crt -days 365 -sha256

echo "Create server file"
touch server.js
echo "
// server.js
const app = require('express')();
const https = require('https');
const fs = require('fs');
const options = {
  key: fs.readFileSync('~/ssl/server.key'),
  cert: fs.readFileSync('~/ssl/server.crt'),
}

https.createServer(options, (req, res) => {
  res.writeHead(200);
  res.end('Hello, HTTPS World!');
}).listen(443, () => {
  console.log('Server is running on port 443');
});
" >> server.js
echo "Adding server to root"
sudo security add-trusted-cert -d -r trustRoot -k "/Library/Keychains/System.keychain" <path_to_certificate_file>
echo "Running server"
node server.js
```

Killing the Process on Linux
```bash
sudo lsof -i :3000
kill -9 27924
```


Killing the Process on windows
```bash
netstat -ano|findstr "PID :3000"         # find the PID
netstat -ano | findstr :3000            # find the PID
taskkill /F /PID 27924                  # kill the PID
```


```javascript
await sequelize.query('SELECT 1', {
  // A function (or false) for logging your queries
  // Will get called for every SQL query that gets sent
  // to the server.
  logging: console.log,

  // If plain is true, then sequelize will only return the first
  // record of the result set. In case of false it will return all records.
  plain: false,

  // Set this to true if you don't have a model definition for your query.
  raw: false,

  // The type of query you are executing. The query type affects how results are formatted before they are passed back.
  type: QueryTypes.SELECT,
});

```