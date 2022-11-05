const fs = require('fs');
const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => {
  res.send(fs.readFileSync('./dist/build.js').toString('utf-8'));
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
