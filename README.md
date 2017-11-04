# gothamist scraper

## purpose

[fuck joe ricketts](https://www.washingtonpost.com/amphtml/news/the-fix/wp/2017/11/03/joe-rickettss-scorched-earth-attack-on-local-media/). pulls down gothamist articles by author and stores as markdown files

## installation

this runs in docker, so you shouldn't need anything besides that. make sure that the `authors` array is up to date (it is in `/src/load.js`) and then just run `docker-compose up --build`.

you can see the queue activity at [http://127.0.0.1:3000](http://127.0.0.1:3000).

## running

you can use the `--scale` flag with `docker-compose` to restart the app without re-loading the initial data and setting the number of `worker` containers with `docker-compose up --scale worker=2`.

the generated markdown files should be sorted by author in `/data`
