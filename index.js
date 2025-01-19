const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'index.html'));
});

app.get("/globecat", (req, res) => {
  res.sendFile(path.join(__dirname, '/', 'globecat.html'));
});

app.use(express.static(__dirname + '/public/'));

app.listen(port, () => {
  console.log(`listening on port ${port}!`);
});
