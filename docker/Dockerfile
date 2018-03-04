FROM ubuntu:xenial

VOLUME ["/var/www"]

# Install needed Ubuntu packages for having Apache PHP as a module and other utilites
RUN apt-get update && \
	apt-get install -y \
	apache2 \
	php7.0 \
	php7.0-cli \
	libapache2-mod-php7.0 \
	php-apcu \
	php-xdebug \
	php7.0-gd \
	php7.0-json \
	php7.0-ldap \
	php7.0-mbstring \
	php7.0-mysql \
	php7.0-pgsql \
	php7.0-sqlite3 \
	php7.0-xml \
	php7.0-xsl \
	php7.0-zip \
	php7.0-soap \
	php7.0-opcache \
	composer \
	curl \
	mysql-client \
	vim \
	nano \
	less \
	subversion \
	ssmtp

# Copy a defulat config file for an apache host
COPY ./apache_default /etc/apache2/sites-available/000-default.conf

# Copy our entrypoint bash script
COPY ./run.sh /usr/local/bin/run

# Copy a default set of settings for PHP (php.ini)
COPY ./php.ini /etc/php/7.0/apache2/conf.d/20-jetpack-wordpress.ini

# Copy a default set of settings for ssmtp.
COPY ./ssmtp.conf /etc/ssmtp/ssmtp.conf

# Make our entrypoing script be executable
RUN chmod +x /usr/local/bin/run

# Enable mod_rewrite in Apache
RUN a2enmod rewrite

# Install wp-cli
RUN curl -o /usr/local/bin/wp -SL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli-nightly.phar \
	&& chmod +x /usr/local/bin/wp

# Install PHPUnit
RUN curl https://phar.phpunit.de/phpunit-5.7.5.phar -L -o phpunit.phar \
	&& chmod +x phpunit.phar \
	&& mv phpunit.phar /usr/local/bin/phpunit

# Get the latest WordPress source code which is needed for running Jetpack unit tests
RUN svn co https://develop.svn.wordpress.org/trunk/tests/phpunit/data /tmp/wordpress-develop/tests/phpunit/data --trust-server-cert --non-interactive
RUN svn co https://develop.svn.wordpress.org/trunk/tests/phpunit/includes /tmp/wordpress-develop/tests/phpunit/includes --trust-server-cert --non-interactive

# Run the entrypoint as root
USER root
CMD ["/usr/local/bin/run"]
