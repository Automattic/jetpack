FROM wordpress:latest


# install the PHP extensions we need
RUN apt-get update && apt-get install -y vim less \


# Add WP-CLI
# RUN curl -o /bin/wp https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
# RUN chmod +x /bin/wp
