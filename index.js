const express = require('express');
const path = require('path');
const https = require('https');
const http = require('http');
const fs = require('fs');
const app = express();
//const options = {
//  key: fs.readFileSync(path.join(__dirname, '/keys/', 'server.key')),
//  cert: fs.readFileSync(path.join(__dirname, '/keys/', 'server.crt'))
//};

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.get("/globecat", (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'globecat.html'));
});

app.get("/gummybear", (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'gummybear.html'));
});

app.use(express.static(__dirname + '/public/'));

http.createServer(app).listen(8080);
//https.createServer(options, app).listen(3000);
