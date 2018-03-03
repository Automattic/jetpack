FROM ubuntu:xenial

VOLUME ["/var/www"]

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
	  less

COPY ./apache_default /etc/apache2/sites-available/000-default.conf
COPY ./run.sh /usr/local/bin/run
COPY ./htaccess /var/www/.htaccess
COPY ./php.ini /etc/php/7.0/apache2/conf.d/20-jetpack-wordpress.ini
RUN chmod +x /usr/local/bin/run
RUN a2enmod rewrite

# Install wp-cli
RUN curl -o /usr/local/bin/wp -SL https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli-nightly.phar \
    && chmod +x /usr/local/bin/wp

# Install PHPUnit
RUN curl https://phar.phpunit.de/phpunit-5.7.5.phar -L -o phpunit.phar \
    && chmod +x phpunit.phar \
    && mv phpunit.phar /usr/local/bin/phpunit


#RUN if [ ! -e "/var/www/xmlrpc.php" ]; then chmod -x /var/www/ && cd /var/www/ && wp core download; else echo 'WordPress Installed'; fi

USER root
CMD ["/usr/local/bin/run"]
