#!/bin/bash

if [ "$WP_TRAVISCI" != "phpunit" ]; then
	gem install sass
	gem install compass
	npm install -g npm
	npm install -g gulp-cli
	npm install
fi
