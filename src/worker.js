const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const { each: asyncEach } = require('async');
const cheerio = require('cheerio');
const kebab = require('lodash.kebabcase');
const kue = require('kue');
const mkdirp = require('mkdirp');
const range = require('lodash.range');
const request = require('request');

const {
  NEED_POST_CONTENT,
  NEED_POST_URLS,
  NEED_TO_WRITE_FILE
} = require('./constants');

const queue = kue.createQueue({
  redis: {
    host: 'redis'
  }
});

// queue.process
// call done() with nothing if successful, with an Error if not

queue.process(NEED_POST_URLS, (job, done) => {
  const { author, page } = job.data;
  const root =
    'https://web.archive.org/web/20170616024218/http://gothamist.com/author';
  const archiveUrl = `${root}/${querystring.escape(author)}/${page === 1
    ? ''
    : page}`;
  console.log(`requesting ${archiveUrl} to get a bunch of links`);
  request(archiveUrl, (httpError, response, body) => {
    if (httpError) {
      return done(new Error(httpError));
    }

    const $ = cheerio.load(body);
    const urls = $('.entry-title a')
      .map((i, el) => $(el).attr('href'))
      .toArray()
      .map(url => {
        console.log('url', url);
        return {
          author,
          url,
          title: `${url} by ${author}`
        };
      });

    console.log('URLS', urls);

    const addUrlToQueue = (urlObj, cb) => {
      queue
        .create(NEED_POST_CONTENT, urlObj)
        .attempts(3)
        .backoff({ delay: 60 * 1000, type: 'fixed' })
        .save(err => {
          if (err) return cb(err);
          cb(null);
        });
    };

    asyncEach(urls, addUrlToQueue, err => {
      if (err) return done(new Error(err));
      done();
    });
  });
});

queue.process(NEED_POST_CONTENT, (job, done) => {
  const url = job.data.url;

  console.log(`requesting ${url} to get the post content`);
  request(url, (error, response, body) => {
    if (error) {
      return done(new Error(error));
    }

    const $ = cheerio.load(body);
    const author = $('.byline .author a').text();
    const date = $('.byline abbr').text();
    const html = $('.entry-body').html();
    const title = $('.entry-header h1').text();

    queue
      .create(NEED_TO_WRITE_FILE, {
        url,
        author,
        date,
        html,
        title
      })
      .attempts(3)
      .backoff({ delay: 60 * 1000, type: 'fixed' })
      .save(err => {
        if (err) {
          console.error(err, url);
          return done(new Error(err));
        }

        done();
      });
  });
});

queue.process(NEED_TO_WRITE_FILE, (job, done) => {
  const { author, date, title, html } = job.data;
  const filename = `${kebab(title)}.md`;
  const filepath = path.join('/app/data', kebab(author), filename);
  const file = `---\nauthor: ${author}\ndate: ${date}\ntitle: ${title}\n---\n\n${html}`;
  mkdirp(path.join('/app/data', kebab(author)), mkErr => {
    if (mkErr) return done(new Error(mkErr));

    console.log(`writing the data to ${filepath}`, {
      author,
      date,
      title
    });
    fs.writeFile(filepath, file, fsErr => {
      if (fsErr) return done(new Error(fsErr));
      done();
    });
  });
});
