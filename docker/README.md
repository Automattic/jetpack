# Docker environment for Jetpack Development

With this directory we provide a hopefully comfortable environment for developing WordPress using a customized docker container providing the following goodies:

* An ubuntu base operating system.
* Latest WordPress version
	* Jetpack source code will be available as an active plugin.
* PHPUnit Installation
	* WordPress tests and source code is provided too.
* MailDev so it's easy to work and design emails.
	* Maildev provides a web interface that comes in handy so everytime this WordPress site sends an email you'll be able to smoke test it with a web browser.
* Handy npm/yarn commands like `yarn docker:up` and `yarn docker:phpunit` to simplify the usage of this.

## Useful commands for taking advantage of the Docker environment

**All of these commands should be run from the base jetpack directory. Not while standing on the `docker` directory**. Like:

```sh
$ git clone git@github.com:Automattic/jetpack.git
$ cd jetpack
$ yarn docker:up
$ #You can browse to http://localhost now
```


### Starting the development environment

`yarn docker:up`

This will start actually three containers (WordPress, MySQL and maildev). Wrapper for `docker-composer up`.

This command will rebuild the WordPress container if you made any changes to `docker-composer.yml`. But it won't build the images again on its own if you changed any of the other files like `Dockerfile`, `run.sh` (The entrypoint) or the provisioned files for configuring Apache and PHP. See `yarn docker:build`.

### Stopping the development environment

`yarn docker:stop`

Will stop all of the containers. Wrapper for `docker-composer stop`.

### Rebuilding the images

`yarn docker:build`

This command comes in hand when you've updated `Dockerfile`, `docker-composer.yml`, or the provisioned files we use for configuring Apache and PHP.

This will help with building the base WordPress image before you run `yarn docker:up` again.

### Accessing logs


#### PHP error log

`yarn docker:tail`

This will `tail -f` the PHP error log.

### Running unit tests

`yarn docker:phpunit`

This will run unit tests for jetpack. You can pass arguments to `phpunit` like `--filter=protect` to it.
