const kue = require('kue');
const range = require('lodash.range');
const { AUTHORS, NEED_POST_URLS } = require('./constants');

const queue = kue.createQueue({
  redis: {
    host: 'redis'
  }
});

AUTHORS.forEach(author => {
  const pages = range(1, 21);
  pages.forEach(page => {
    const title = `${author}-page-${page}`;
    queue.create(NEED_POST_URLS, { author, page, title }).save(err => {
      if (err) console.log(err);
    });
  });
});
