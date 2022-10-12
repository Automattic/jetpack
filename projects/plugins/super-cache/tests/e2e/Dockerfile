FROM wordpress:latest

# Install wp-cli
RUN curl -o /bin/wp-cli.phar https://raw.githubusercontent.com/wp-cli/builds/gh-pages/phar/wp-cli.phar
RUN chmod +x /bin/wp-cli.phar
RUN ln -s /bin/wp-cli.phar /usr/bin/wp

ENV WORDPRESS_DB_HOST=db
ENV WORDPRESS_DB_USER=wordpress
ENV WORDPRESS_DB_PASSWORD=wordpress
ENV WORDPRESS_DB_NAME=wordpress

# Override standard entry-point with our own wrapper to finish installing WP.
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["apache2-wrapper"]
