# Docker environment for Jetpack Development

With this directory we provide a hopefully comfortable environment for developing WordPress using a Docker container providing the following goodies:

* An Ubuntu base operating system.
* Latest WordPress version.
	* Jetpack source code will be available as plugin from parent directory.
* PHPUnit Installation
	* WordPress tests and source code is provided too.
* MailDev to catch all the emails leaving WordPress so that you can observe them from browser.
* Handy NPM/Yarn shorthand commands like `yarn docker:up` and `yarn docker:phpunit` to simplify the usage.

## To get started

**All of these commands should be run from the base jetpack directory. Not from the `docker` directory!**

```sh
$ git clone https://github.com/Automattic/jetpack.git
$ cd jetpack
$ yarn docker:up
```

Uninstalled WordPress is running in [http://localhost](http://localhost) now. You can proxy to your localhost e.g. with [Ngrok](https://ngrok.com/) to be able to connect Jetpack.

To debug emails open [http://localhost:1080](http://localhost:1080).

### Start containers

```sh
yarn docker:up
```

Start three containers (WordPress, MySQL and MailDev) defined in `docker-composer.yml`. Wrapper for `docker-composer up`.

This command will rebuild the WordPress container if you made any changes to `docker-composer.yml`. It won't build the images again on its own if you changed any of the other files like `Dockerfile`, `run.sh` (the entry-point file) or the provisioned files for configuring Apache and PHP. See "rebuilding images".

### Stop containers

```sh
yarn docker:stop
```

Stops all containers. Wrapper for `docker-composer stop`.

`yarn docker:down`

Will stop all of the containers created by this docker-compose configuration and remove them too. It won't remove the images. Just the containers that have just been stopped.

### Rebuild images

```sh
yarn docker:build
```

You need to rebuild the WordPress image with this command if you modified `Dockerfile`, `docker-composer.yml` or the provisioned files we use for configuring Apache and PHP.

### Accessing logs

Logs are stored in your filesystem under `./docker/logs` directory.

#### PHP error log

To `tail -f` the PHP error log, run:

```sh
yarn docker:tail
```

### MySQL database

To connect to your MySQL database from outside the container, use:

- Host: `127.0.0.1`
- Port: `3306`
- User: `wordpress`
- Pass: `wordpress`
- Database: `wordpress`

You can also see your database files via local filesystem at `./docker/data/mysql`

### Debugging emails

Emails don't leave your WordPress and are caught by [MailDev](http://danfarrelly.nyc/MailDev/) SMTP server container instead.

To debug emails via web-interface, open [http://localhost:1080](http://localhost:1080)

If you want to send emails out from your containers, you must configure external SMTP server at `docker/ssmtp.conf` and rebuild your image.

### Running unit tests

```sh
yarn docker:phpunit
```

This will run unit tests for Jetpack. You can pass arguments to `phpunit` like so:

```sh
yarn docker:phpunit --filter=Protect
```

### Starting over

To remove all docker images, all mysql data, and all docker-related files from your local machine run:

```sh
yarn docker:clean
```

### Using WP CLI

You can run [WP CLI](https://make.wordpress.org/cli/) commands inside WordPress container.

To run e.g. [`cron event list`](https://developer.wordpress.org/cli/commands/cron/event/list/):

```sh
yarn docker:cli cron event list
```

### Must Use Plugins directory

You can add your own PHP code to `./docker/mu-plugins` directory and they will be loaded by WordPress, in alphabetical order, before normal plugins, meaning API hooks added in an mu-plugin apply to all other plugins even if they run hooked-functions in the global namespace. Read more about [must use plugins](https://codex.wordpress.org/Must_Use_Plugins).

You can add your custom Jetpack constants (such as `JETPACK__API_BASE`) to a file under this folder.
