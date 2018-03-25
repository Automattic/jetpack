FROM ubuntu:xenial

VOLUME ["/var/www/html"]

# Install required Ubuntu packages for having Apache PHP as a module
# as well a bunch of other packages
RUN apt-get update && apt-get install -y \
	apache2 \
	composer \
	curl \
	less \
	libapache2-mod-php7.0 \
	mysql-client \
	nano \
	php-apcu \
	php-xdebug \
	php7.0 \
	php7.0-cli \
	php7.0-gd \
	php7.0-json \
	php7.0-ldap \
	php7.0-mbstring \
	php7.0-mysql \
	php7.0-opcache \
	php7.0-pgsql \
	php7.0-soap \
	php7.0-sqlite3 \
	php7.0-xml \
	php7.0-xsl \
	php7.0-zip \
	ssmtp \
	subversion \
	sudo \
	vim \
	&& rm -rf /var/lib/apt/lists/*

# Enable mod_rewrite in Apache
RUN a2enmod rewrite

# Install wp-cli
RUN curl -o /usr/local/bin/wp -SL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli-nightly.phar \
	&& chmod +x /usr/local/bin/wp

# Install PHPUnit
RUN curl https://phar.phpunit.de/phpunit-5.7.5.phar -L -o phpunit.phar \
	&& chmod +x phpunit.phar \
	&& mv phpunit.phar /usr/local/bin/phpunit

# Copy a default config file for an apache host
COPY ./config/apache_default /etc/apache2/sites-available/000-default.conf

# Copy a default set of settings for PHP (php.ini)
COPY ./config/php.ini /etc/php/7.0/apache2/conf.d/20-jetpack-wordpress.ini
COPY ./config/php.ini /etc/php/7.0/cli/conf.d/20-jetpack-wordpress.ini

# Copy single site htaccess to tmp. run.sh will move it to the site's base dir if there's none present.
COPY ./config/htaccess /tmp/htaccess

# Copy wp-tests-config to tmp. run.sh will move it to the WordPress source code base dir if there's none present.
COPY ./config/wp-tests-config.php /tmp/wp-tests-config.php

# Copy a default set of settings for SMTP.
COPY ./config/ssmtp.conf /etc/ssmtp/ssmtp.conf

# Copy our cmd bash script
COPY ./bin/run.sh /usr/local/bin/run

# Make our cmd script be executable
RUN chmod +x /usr/local/bin/run

# Set the working directory for the next commands
WORKDIR /var/www/html

CMD ["/usr/local/bin/run"]
