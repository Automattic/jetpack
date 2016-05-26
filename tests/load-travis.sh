#!/bin/bash

if [ "$WP_TRAVISCI" != "phpunit" ]; then
	gem install sass
	gem install compass
	nvm install 5
    npm install -g npm@'3.8.9'
    npm install -g gulp-cli
    npm install
fi