ARG PHP_VERSION=7.0-apache
FROM php:${PHP_VERSION}

VOLUME ["/var/www/html"]

# Install required Ubuntu packages for having Apache PHP as a module
# as well a bunch of other packages
RUN apt-get update && apt-get install -y --no-install-recommends \
	curl \
	less \
	#mysql-client \
	nano \
	ssmtp \
	subversion \
	sudo \
	vim \
	libjpeg-dev \
	libpng-dev \
	&& rm -rf /var/lib/apt/lists/* \
	&& pecl install xdebug \
	&& docker-php-ext-configure gd --with-png-dir=/usr --with-jpeg-dir=/usr \
	&& docker-php-ext-install gd mysqli opcache \
	&& docker-php-ext-enable xdebug

#RUN php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" && \
#	php -r "if (hash_file('SHA384', 'composer-setup.php') === 'SIGNATURE') { echo 'Installer verified'; } else { echo 'Installer corrupt'; unlink('composer-setup.php'); } echo PHP_EOL;" \
#	&& php composer-setup.php --install-dir=/usr/local/bin --filename=composer \
#	&& php -r "unlink('composer-setup.php');"

# Enable mod_rewrite in Apache
RUN a2enmod rewrite

# Install wp-cli
RUN curl -o /usr/local/bin/wp -SL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli-nightly.phar \
	&& chmod +x /usr/local/bin/wp

# Install PHPUnit
RUN curl https://phar.phpunit.de/phpunit-5.7.5.phar -L -o phpunit.phar \
	&& chmod +x phpunit.phar \
	&& mv phpunit.phar /usr/local/bin/phpunit

# Copy a default set of settings for PHP (php.ini)
COPY ./config/php.ini /usr/local/etc/php/conf.d/jetpack-wordpress.ini

# Copy single site htaccess to tmp. run.sh will move it to the site's base dir if there's none present.
COPY ./config/htaccess /tmp/htaccess
COPY ./config/htaccess-multi /tmp/htaccess-multi

# Copy wp-tests-config to tmp. run.sh will move it to the WordPress source code base dir if there's none present.
COPY ./config/wp-tests-config.php /tmp/wp-tests-config.php

# Copy a default set of settings for SMTP.
COPY ./config/ssmtp.conf /etc/ssmtp/ssmtp.conf

# Copy our cmd bash script
COPY ./bin/run.sh /usr/local/bin/run

# Make our cmd script be executable
RUN chmod +x /usr/local/bin/run

#CMD ["/usr/local/bin/run"]
