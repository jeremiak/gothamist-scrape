# gothamist scraper

## purpose

[fuck joe ricketts](https://www.washingtonpost.com/amphtml/news/the-fix/wp/2017/11/03/joe-rickettss-scorched-earth-attack-on-local-media/). pulls down gothamist articles by author and stores as markdown files

## installation

this runs in docker, so you shouldn't need anything besides that. make sure that the `AUTHORS` array is up to date (it is in `/src/constants.js`) and then just run `docker-compose up --build`.

you can see the queue activity at [http://127.0.0.1:3000](http://127.0.0.1:3000).

## running

make sure you have a `data` directory in this project folder (a sibling to `src`). this is where the markdown files will be written.

you can use the `--scale` flag with `docker-compose` to restart the app without re-loading the initial data and setting the number of `worker` containers with `docker-compose up --scale load=0 --scale worker=2`.

## output

markdown files should be written into the `data` directory you created. i've been pushing updates occasionally from this app to [jeremiak/gothamist-scrape-data](https://github.com/jeremiak/gothamist-scrape-data).
