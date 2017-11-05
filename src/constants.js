const prefix = 'gothamist-scraper';

const AUTHORS = [
  'Ben Yakas',
  'Dan Dickinson',
  'Emma Whitford',
  'Jen Carlson',
  'Jen Chung',
  'Nell Casey'
];

const HAS_NO_ARCHIVE = `${prefix}-has-no-archive`;
const HAS_NO_TITLE = `${prefix}-has-no-title`;
const HAS_UNMATCHED_AUTHOR = `${prefix}-has-unmatched-author`;

const NEED_POST_CONTENT = `${prefix}-need-post-content`;
const NEED_POST_URLS = `${prefix}-need-post-urls`;
const NEED_TO_WRITE_FILE = `${prefix}-need-to-write-file`;

module.exports = {
  AUTHORS,
  HAS_NO_ARCHIVE,
  HAS_NO_TITLE,
  HAS_UNMATCHED_AUTHOR,
  NEED_POST_CONTENT,
  NEED_POST_URLS,
  NEED_TO_WRITE_FILE
};
