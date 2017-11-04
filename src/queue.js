const kue = require('kue');
const queue = kue.createQueue({
  redis: {
    host: 'redis'
  }
});

kue.app.set('title', 'Gothamist scraping queue');
kue.app.listen(3000);
