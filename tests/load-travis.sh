#!/bin/bash

if [ "$WP_TRAVISCI" != "phpunit" ]; then
	gem install sass
	gem install compass
	source ~/.nvm/nvm.sh
	nvm install 5
	nvm alias default 5
	npm install -g npm
	npm install -g gulp-cli
	npm install
fi
