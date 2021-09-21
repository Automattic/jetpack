FROM ubuntu:focal

VOLUME ["/var/www/html"]

ARG PHP_VERSION
ARG COMPOSER_VERSION

ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

# Install basic packages, including Apache.
RUN \
	export DEBIAN_FRONTEND=noninteractive \
	&& apt-get update \
	&& apt-get install -y language-pack-en-base software-properties-common \
	&& add-apt-repository ppa:ondrej/php \
	&& apt-get update \
	&& apt-get install -y \
		apache2 \
		curl \
		git \
		less \
		libsodium23 \
		mysql-client \
		nano \
		ssmtp \
		subversion \
		sudo \
		unzip \
		vim \
	&& rm -rf /var/lib/apt/lists/*

# Enable mod_rewrite in Apache.
RUN a2enmod rewrite

# Install requested version of PHP.
RUN \
	: "${PHP_VERSION:?Build argument PHP_VERSION needs to be set and non-empty.}" \
	&& export DEBIAN_FRONTEND=noninteractive \
	&& apt-get update \
	&& apt-get install -y \
		libapache2-mod-php${PHP_VERSION} \
		php${PHP_VERSION} \
		php${PHP_VERSION}-apcu \
		php${PHP_VERSION}-bcmath \
		php${PHP_VERSION}-cli \
		php${PHP_VERSION}-curl \
		php${PHP_VERSION}-gd \
		php${PHP_VERSION}-imagick \
		php${PHP_VERSION}-json \
		php${PHP_VERSION}-ldap \
		php${PHP_VERSION}-mbstring \
		php${PHP_VERSION}-mysql \
		php${PHP_VERSION}-opcache \
		php${PHP_VERSION}-pgsql \
		php${PHP_VERSION}-soap \
		php${PHP_VERSION}-sqlite3 \
		php${PHP_VERSION}-xdebug \
		php${PHP_VERSION}-xml \
		php${PHP_VERSION}-xsl \
		php${PHP_VERSION}-zip \
	&& rm -rf /var/lib/apt/lists/*

# Install requested version of Composer.
RUN \
	: "${COMPOSER_VERSION:?Build argument COMPOSER_VERSION needs to be set and non-empty.}" \
	&& php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
	&& php composer-setup.php --install-dir=/usr/local/bin --filename=composer --version=$COMPOSER_VERSION \
	&& php -r "unlink('composer-setup.php');"

# Install wp-cli.
RUN curl -o /usr/local/bin/wp -fSL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli-nightly.phar \
	&& chmod +x /usr/local/bin/wp

# Install PsySH to use in wp-cli shell.
RUN mkdir /usr/local/src/psysh \
	&& cd /usr/local/src/psysh \
	&& composer require psy/psysh:@stable \
	&& mkdir ~/.wp-cli \
	&& echo "require: /usr/local/src/psysh/vendor/autoload.php" > ~/.wp-cli/config.yml \
	&& rm -rf ~/.cache ~/.config ~/.local ~/.subversion

# Install old version of PHPUnit needed for WP unit tests.
RUN curl https://phar.phpunit.de/phpunit-7.phar -fSL -o phpunit.phar \
	&& chmod +x phpunit.phar \
	&& mv phpunit.phar /usr/local/bin/phpunit

# Copy a default config file for an apache host.
COPY ./config/apache_default /etc/apache2/sites-available/000-default.conf

# Copy a default set of settings for PHP (php.ini).
COPY ./config/php.ini /etc/php/${PHP_VERSION}/apache2/conf.d/20-jetpack-wordpress.ini
COPY ./config/php.ini /etc/php/${PHP_VERSION}/cli/conf.d/20-jetpack-wordpress.ini

# Copy single site htaccess to /var/lib/jetpack-config. run.sh will move it to the site's base dir if there's none present.
COPY ./config/htaccess /var/lib/jetpack-config/htaccess
COPY ./config/htaccess-multi /var/lib/jetpack-config/htaccess-multi

# Copy wp-tests-config to /var/lib/jetpack-config. run.sh will move it to the WordPress source code base dir if there's none present.
COPY ./config/wp-tests-config.php /var/lib/jetpack-config/wp-tests-config.php

# Copy a default set of settings for SMTP.
COPY ./config/ssmtp.conf /etc/ssmtp/ssmtp.conf

# Copy our cmd bash script.
COPY ./bin/run.sh /usr/local/bin/run

# Make our cmd script be executable.
RUN chmod +x /usr/local/bin/run

# Set the working directory for the next commands.
WORKDIR /var/www/html

CMD ["/usr/local/bin/run"]
