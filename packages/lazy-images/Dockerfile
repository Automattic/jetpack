FROM wordpress:php7.2

RUN apt-get update && apt-get install -y less wget git subversion unzip

RUN curl -O https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar && \
    chmod +x wp-cli.phar && \
    mv wp-cli.phar /usr/local/bin/wp

RUN curl -s https://getcomposer.org/installer | php && \
    mv composer.phar /usr/local/bin/composer
