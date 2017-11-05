const express = require('express');
const kue = require('kue');
const ui = require('kue-ui-express');

const app = express();
const queue = kue.createQueue({
  redis: {
    host: 'redis'
  }
});

ui(app, '/admin/', '/api/');

// app.set('title', 'Gothamist scraping queue');
app.use('/api/', kue.app);

app.listen(3000);
