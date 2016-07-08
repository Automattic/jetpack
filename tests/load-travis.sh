#!/bin/bash

if [ "$WP_TRAVISCI" == "npm run test-client" ]; then
	gem install sass
	gem install compass
	source ~/.nvm/nvm.sh
	nvm install 5
	nvm alias default 5
	npm install -g npm
	npm install -g gulp-cli
	npm install
fi

if [ "$WP_TRAVISCI" == "gulp travis:js" ]; then
	npm install -g gulp-cli
fi
