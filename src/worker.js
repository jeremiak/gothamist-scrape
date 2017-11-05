const fs = require('fs');
const path = require('path');
const querystring = require('querystring');

const { each: asyncEach } = require('async');
const cheerio = require('cheerio');
const kebabCase = require('lodash.kebabcase');
const kue = require('kue');
const mkdirp = require('mkdirp');
const range = require('lodash.range');
const request = require('request');
const startCase = require('lodash.startcase');

const {
  AUTHORS,
  HAS_NO_TITLE,
  HAS_UNMATCHED_AUTHOR,
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

queue.process(NEED_POST_URLS, (job, ctx, done) => {
  const { author, page } = job.data;
  const root =
    'https://web.archive.org/web/20170616024218/http://gothamist.com/author';
  const archiveUrl = `${root}/${querystring.escape(author)}/${page === 1
    ? ''
    : page}`;
  console.log(`requesting ${archiveUrl} to get a bunch of links`);
  request(archiveUrl, (httpError, response, body) => {
    if (httpError) {
      if (httpError.code === 'ECONNREFUSED') {
        return ctx.pause(2000, err => {
          console.log('pausing worker because too many connections');
          done(new Error(httpError));
          setTimeout(function() {
            console.log('resuming worker now');
            ctx.resume();
          }, 5000);
        });
      }

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

queue.process(NEED_POST_CONTENT, 2, (job, ctx, done) => {
  const url = job.data.url;

  console.log(`requesting ${url} to get the post content`);
  request(url, (httpError, response, body) => {
    if (httpError) {
      if (httpError.code === 'ECONNREFUSED') {
        return ctx.pause(2000, err => {
          console.log('pausing worker because too many connections');
          done(new Error(httpError));
          setTimeout(function() {
            ctx.resume();
          }, 5000);
        });
      }

      return done(new Error(httpError));
    }

    const $ = cheerio.load(body);
    const author = $('.byline .author a').text();
    const date = $('.byline abbr').text();
    const html = $('.entry-body').html();
    let title = $('.entry-header h1').text();
    let queueName = NEED_TO_WRITE_FILE;

    if (title === '') {
      queueName = HAS_NO_TITLE;
      title = url;
    } else if (!AUTHORS.includes(startCase(author))) {
      queueName = HAS_UNMATCHED_AUTHOR;
    }

    queue
      .create(queueName, {
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

queue.process(NEED_TO_WRITE_FILE, 2, (job, ctx, done) => {
  const { author, date, title, html } = job.data;
  const filename = `${kebabCase(title)}.md`;
  const filepath = path.join('/app/data', kebabCase(author), filename);
  const file = `---\nauthor: ${author}\ndate: ${date}\ntitle: ${title}\n---\n\n${html}`;
  mkdirp(path.join('/app/data', kebabCase(author)), mkErr => {
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
