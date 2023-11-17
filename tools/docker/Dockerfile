FROM ubuntu:22.04

VOLUME ["/var/www/html"]

ARG PHP_VERSION
ARG COMPOSER_VERSION
ARG NODE_VERSION
ARG PNPM_VERSION

ENV LANG en_US.UTF-8
ENV LC_ALL en_US.UTF-8

WORKDIR /tmp

# Record ARGs
RUN \
	echo "PHP_VERSION=$PHP_VERSION" > /etc/docker-args.sh \
	&& echo "NODE_VERSION=$NODE_VERSION" >> /etc/docker-args.sh \
	&& echo "COMPOSER_VERSION=$COMPOSER_VERSION" >> /etc/docker-args.sh \
	&& echo "PNPM_VERSION=$PNPM_VERSION" >> /etc/docker-args.sh

# Install basic packages, including Apache.
RUN --mount=type=cache,target=/var/lib/apt/lists/,sharing=private \
	export DEBIAN_FRONTEND=noninteractive \
	&& apt-get update \
	&& apt-get install -y curl gpg language-pack-en-base software-properties-common \
	&& add-apt-repository ppa:ondrej/php \
	&& curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
	&& apt-get update \
	&& apt-get --purge install -y \
		apache2 \
		git \
		jq \
		less \
		libsodium23 \
		mysql-client \
		nano \
		ssmtp \
		subversion \
		sudo \
		systemd-standalone-tmpfiles \
		unzip \
		vim \
		zip \
	&& apt-get remove --purge --auto-remove -y gpg software-properties-common \
	&& find /var/ -name '*-old' -delete && rm -rf /var/log/dpkg.log /var/log/alternatives.log /var/log/apt/ ~/.launchpadlib

# Enable various Apache modules.
RUN a2dismod mpm_prefork && a2enmod rewrite mpm_event proxy_fcgi http2

# Install requested version of PHP.
COPY ./config/php.ini /var/lib/jetpack-config/php.ini
RUN --mount=type=cache,target=/var/lib/apt/lists/,sharing=private \
	--mount=type=bind,source=./bin/ensure-php-version.sh,target=/usr/local/bin/ensure-php-version.sh \
	: "${PHP_VERSION:?Build argument PHP_VERSION needs to be set and non-empty.}" \
	&& ensure-php-version.sh "$PHP_VERSION" \
	&& a2enconf "php$PHP_VERSION-fpm" \
	&& find /var/ -name '*-old' -delete && rm -rf /var/log/dpkg.log /var/log/alternatives.log /var/log/apt/ ~/.launchpadlib

# Install requested version of Composer.
RUN \
	: "${COMPOSER_VERSION:?Build argument COMPOSER_VERSION needs to be set and non-empty.}" \
	&& php -r "copy('https://getcomposer.org/installer', 'composer-setup.php');" \
	&& php composer-setup.php --install-dir=/usr/local/bin --filename=composer --version=$COMPOSER_VERSION \
	&& php -r "unlink('composer-setup.php');" \
	&& rm -rf ~/.composer

# Install requested version of Node.
RUN --mount=type=cache,target=/var/lib/apt/lists/,sharing=private \
	: "${NODE_VERSION:?Build argument NODE_VERSION needs to be set and non-empty.}" \
	&& export DEBIAN_FRONTEND=noninteractive \
	&& N=${NODE_VERSION%%.*} \
	&& echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_$N.x nodistro main" > /etc/apt/sources.list.d/nodesource.list \
	&& apt-get -q update \
	&& VER="$(apt-cache show nodejs | sed -n "/^Version: ${NODE_VERSION}-/ { s/^Version: /=/p; q }" )" \
	&& apt-get install -y nodejs$VER \
	&& find /var/ -name '*-old' -delete && rm -rf /var/log/dpkg.log /var/log/alternatives.log /var/log/apt/ ~/.launchpadlib

# Install requested version of pnpm.
RUN \
	: "${PNPM_VERSION:?Build argument PNPM_VERSION needs to be set and non-empty.}" \
	&& npm install --global pnpm@$PNPM_VERSION \
	&& SHELL=/bin/bash pnpm setup \
	&& rm -rf ~/.npm

# Install wp-cli.
RUN curl -o /usr/local/bin/wp -fSL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli-nightly.phar \
	&& chmod +x /usr/local/bin/wp

# Install PsySH to use in wp-cli shell.
RUN mkdir /usr/local/src/psysh \
	&& cd /usr/local/src/psysh \
	&& composer require psy/psysh:@stable \
	&& mkdir ~/.wp-cli \
	&& echo "require: /usr/local/src/psysh/vendor/autoload.php" > ~/.wp-cli/config.yml \
	&& rm -rf ~/.composer ~/.subversion

# Copy a default config file for an apache host.
COPY ./config/apache_default /etc/apache2/sites-available/000-default.conf

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
