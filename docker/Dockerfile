FROM ubuntu:xenial

VOLUME ["/var/www/html"]

ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

# Install required Ubuntu packages for having Apache PHP as a module
# as well a bunch of other packages
RUN \
	apt-get update \
	&& apt-get install -y language-pack-en-base software-properties-common \
	&& add-apt-repository ppa:ondrej/php \
	&& apt-get update \
	&& apt-get install -y \
		apache2 \
		composer \
		curl \
		less \
		libapache2-mod-php7.2 \
		mysql-client \
		nano \
		php-apcu \
		php-xdebug \
		php7.2 \
		php7.2-cli \
		php7.2-curl \
		php7.2-gd \
		php7.2-json \
		php7.2-ldap \
		php7.2-mbstring \
		php7.2-mysql \
		php7.2-opcache \
		php7.2-pgsql \
		php7.2-soap \
		php7.2-sqlite3 \
		php7.2-xml \
		php7.2-xsl \
		php7.2-zip \
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
RUN curl https://phar.phpunit.de/phpunit-6.phar -L -o phpunit.phar \
	&& chmod +x phpunit.phar \
	&& mv phpunit.phar /usr/local/bin/phpunit

# Copy a default config file for an apache host
COPY ./config/apache_default /etc/apache2/sites-available/000-default.conf

# Copy a default set of settings for PHP (php.ini)
COPY ./config/php.ini /etc/php/7.2/apache2/conf.d/20-jetpack-wordpress.ini
COPY ./config/php.ini /etc/php/7.2/cli/conf.d/20-jetpack-wordpress.ini

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

# Set the working directory for the next commands
WORKDIR /var/www/html

CMD ["/usr/local/bin/run"]
