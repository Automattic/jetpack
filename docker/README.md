# Docker environment for Jetpack Development

Unified environment for developing Jetpack using Docker containers providing following goodies:

* An Ubuntu base operating system.
* Latest stable version of WordPress.
	* Jetpack source code will be available as plugin from parent directory.
* PHPUnit setup.
* Xdebug setup.
* WP-CLI installed.
* MailDev to catch all the emails leaving WordPress so that you can observe them from browser.
* Handy NPM/Yarn shorthand commands like `yarn docker:up` and `yarn docker:phpunit` to simplify the usage.

## To get started

_**All commands mentioned in this document should be run from the base Jetpack directory. Not from the `docker` directory!**_

#### Prerequisites:
- [Docker](https://www.docker.com/community-edition)
- [NodeJS](https://nodejs.org)
- [Yarn](https://yarnpkg.com/) — please make sure your version is higher than v1.3: `yarn --version`
- Optionally [Ngrok](https://ngrok.com) client and account or some other service for creating a local HTTP tunnel. It’s fine to stay on the free pricing tier with Ngrok.

Install prerequisites and clone the repository:

```sh
git clone https://github.com/Automattic/jetpack.git && cd jetpack
```

Optionally, copy settings file to modify it:
```sh
cp docker/default.env docker/.env
```

Anything you put in `.env` overrides values in `default.env`. You should modify all the password fields for security, for example.

Finally, spin up the containers:
```sh
yarn docker:up
```

Non-installed WordPress is running at [http://localhost](http://localhost) now.

You should establish a tunnel to your localhost with Ngrok or [other similar service](https://alternativeto.net/software/ngrok/) to be able to connect Jetpack. You cannot connect Jetpack when running WordPress via `http://localhost`. Read more from ["Using Ngrok with Jetpack"](#using-ngrok-with-jetpack) section below.

_You are now ready to login to your new WordPress install and connect Jetpack, congratulations!_

You should follow [Jetpack’s development documentation](../docs/development-environment.md) for installing Jetpack’s dependencies and building files. Docker setup does not build these for you.

## Good to know

WordPress’ `WP_SITEURL` and `WP_HOME` constants are configured to be dynamic in `./docker/wordpress/wp-config.php` so you shouldn’t need to change these even if you access the site via different domains.

## Working with containers

### Quick install WordPress

You can to just quickly install WordPress and activate Jetpack via command line. Ensure you have your domain modified in `.env` file, spin up the containers and then run:

```sh
yarn docker:install
```

This will give you a single site with user/pass `wordpress` (unless you changed these from `./docker/.env` file). You will still have to connect Jetpack to WordPress.com manually.

To convert installed single site into a multisite, run:

```sh
yarn docker:multisite-convert
```

To remove WordPress installation and start over, run:

```sh
+yarn docker:uninstall
```

### Start containers

```sh
yarn docker:up
```

Start three containers (WordPress, MySQL and MailDev) defined in `docker-composer.yml`. Wrapper for `docker-composer up`.

This command will rebuild the WordPress container if you made any changes to `docker-composer.yml`. It won’t build the images again on its own if you changed any of the other files like `Dockerfile`, `run.sh` (the entry-point file) or the provisioned files for configuring Apache and PHP. See "rebuilding images".

For running the containers in the background, use:

```sh
yarn docker:up -- -d
```

### Stop containers

```sh
yarn docker:stop
```

Stops all containers. Wrapper for `docker-composer stop`.

```sh
yarn docker:down
```

Will stop all of the containers created by this docker-compose configuration and remove them, too. It won’t remove the images. Just the containers that have just been stopped.

### Rebuild images

```sh
yarn docker:build
```

You need to rebuild the WordPress image with this command if you modified `Dockerfile`, `docker-composer.yml` or the provisioned files we use for configuring Apache and PHP.

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

**Note:** this command does not work in Windows.

### Using WP CLI

You can run [WP CLI](https://make.wordpress.org/cli/) commands inside WordPress container:

```sh
yarn docker:wp COMMAND
```

For example run [`cron event list`](https://developer.wordpress.org/cli/commands/cron/event/list/):

```sh
yarn docker:wp cron event list
```

[`shell`](https://developer.wordpress.org/cli/commands/shell/) is a handy wp-cli command you can use like so:

```bash
yarn docker:wp shell
```

Shell allows you to evaluate PHP code while having your installed WordPress loaded, so you could do things like:

```
wp> get_bloginfo( 'name' );
=> string(6) "WP-CLI"
```

Note that each `wp shell` session counts as a single request, causing unexpected situations with WP cache. You might want to run [`wp_cache_flush()`](https://developer.wordpress.org/reference/functions/wp_cache_flush/) between requests you expect to get cached by WordPress.

## MySQL database

Connecting to your MySQL database from outside the container, use:

- Host: `127.0.0.1`
- Port: `3306`
- User: `wordpress`
- Pass: `wordpress`
- Database: `wordpress`

You can also see your database files via local filesystem at `./docker/data/mysql`

## SFTP access

You can access WordPress and Jetpack files via SFTP server container.

- Host: `localhost`
- Port: `1022`
- User: `wordpress`
- Pass: `wordpress`
- WordPress path: `/var/www/html`

You can tunnel to this container using [Ngrok](https://ngrok.com) or [other similar service](https://alternativeto.net/software/ngrok/).

Tunnelling makes testing [Jetpack Rewind](https://jetpack.com/support/backups/) possible. Read more from ["Using Ngrok with Jetpack"](#using-ngrok-with-jetpack) section below.

## Must Use Plugins directory

You can add your own PHP code to `./docker/mu-plugins` directory and they will be loaded by WordPress, in alphabetical order, before normal plugins, meaning API hooks added in an mu-plugin apply to all other plugins even if they run hooked-functions in the global namespace. Read more about [must use plugins](https://codex.wordpress.org/Must_Use_Plugins).

You can add your custom Jetpack constants (such as `JETPACK__API_BASE`) to a file under this folder.

## Using Ngrok with Jetpack

[Ngrok.com](https://ngrok.com/) free tier gives you one-use random-hash domains for HTTP/HTTPS connections and random ports for other TCP connections. When using their paid plans you can re-use domains, reserve your custom domains and reserve TCP ports.

If you use one-off domains, you'll have to re-install WordPress and re-connect Jetpack each time you close Ngrok (thus losing your randomly assigned domain). That's perfectly fine for quick testing or lightweight development.

You can use [other similar services](https://alternativeto.net/software/ngrok/) as well.

If you're developing Jetpack often with Ngrok, you could create a config file for your setup. See [default configuration file location](https://ngrok.com/docs#default-config-location) from Ngrok Docs or use `-config=your_config_file.yml` argument with `ngrok` to use your configuration file.

In your configuration file, add:

```yml
authtoken: YOUR_AUTH_TOKEN
tunnels:
  jetpack:
    subdomain: YOUR_PERMANTENT_SUBDOMAIN
    addr: 80
    proto: http
  jetpack-sftp:
    addr: 1022
    proto: tcp
    remote_addr: 0.tcp.ngrok.io:YOUR_RESERVED_PORT
```

You should reserve above domain and TCP address from [Ngrok Dashboard → Reserved](https://dashboard.ngrok.com/reserved). As of 03/2018 that requires Ngrok Business plan.

For example your reserved domain could be `abcdefgh.ngrok.io` and reserved TCP address `0.tcp.ngrok.io:12345`.

See more configuration options from [Ngrok documentation](https://ngrok.com/docs#tunnel-definitions).

You can now start both tunnels:
```bash
ngrok start jetpack jetpack-sftp
```

You can inspect traffic between your WordPress/Jetpack container and WordPress.com using [the inspector](https://ngrok.com/docs#inspect).

### Configuring Jetpack Rewind with Ngrok tunnel

You should now be able to configure [Jetpack Rewind](https://jetpack.com/support/backups/) credentials point to your Docker container:

- Credential Type: `SSH/SFTP`
- Server Address: `0.tcp.ngrok.io`
- Port Number: `YOUR_RESERVED_PORT`
- Server username: `wordpress`
- Server password: `wordpress`
- WordPress installation path: `/var/www/html`

## Debugging

### Accessing logs

Logs are stored in your filesystem under `./docker/logs` directory.

#### PHP error log

To `tail -f` the PHP error log, run:

```sh
yarn docker:tail
```

### Debugging emails

Emails don’t leave your WordPress and are caught by [MailDev](http://danfarrelly.nyc/MailDev/) SMTP server container instead.

To debug emails via web-interface, open [http://localhost:1080](http://localhost:1080)

### Debugging PHP with Xdebug

The WordPress image is leveraged with Xdebug present as a PHP Extension.

You’ll likely need to install a browser extension like the following:

* [The easiest Xdebug](https://addons.mozilla.org/en-US/firefox/addon/the-easiest-xdebug/) for Mozilla Firefox
* [Xdebug Helper](https://chrome.google.com/webstore/detail/xdebug-helper/eadndfjplgieldjbigjakmdgkmoaaaoc) for Google Chrome

#### Remote debugging with Atom editor

![Screenshot showing Atom editor with Xdebug](https://user-images.githubusercontent.com/746152/37091829-573605f6-21e8-11e8-9f16-3908854fd7d6.png)

You’ll need to install the [php-debug](https://atom.io/packages/php-debug) package for Atom. Features of this package include:
* Add Breakpoints
* Step through debugging (Over, In, Out)
* Stack and Context views
* Add Watchpoints to inspect current values of variables

##### Configuring Atom editor

1. Install [php-debug](https://atom.io/packages/php-debug) package for your Atom editor.

1. Configure php-debug:

	1. To listen on all addresses (**Server Address**: `0.0.0.0`)
	    ![Screenshot showing "Server Address" input](https://user-images.githubusercontent.com/746152/37093338-c381757e-21ed-11e8-92cd-5b947a2d35ba.png)

	2. To map your current Jetpack directory to the docker filesystem path (**Path Maps** to `/var/www/html/wp-content/plugins/jetpack;/local-path-in-your-computer/jetpack`)

		![Screenshot showing "Path Maps" input](https://user-images.githubusercontent.com/746152/37150779-c891a7f4-22b1-11e8-9293-f34679df82f5.png)

1. Make sure you installed the Chrome extension on your browser and configure it to send the IDE Key `xdebug-atom`

	* In the case of the **Xdebug Helper** extension, you get to set this by right-clicking (secondary click) on the extensions’ icon and clicking **Options**:

		![Screenshot showing Xdebug helper menu](https://user-images.githubusercontent.com/746152/37093557-82b766a6-21ee-11e8-8c0f-93f7ae72b9dc.png)

	* Set the IDE key field to `Other`, enter `xdebug-atom` in the text field, and press Save.

		![Screenshot showing IDE Key](https://user-images.githubusercontent.com/746152/37178231-ac46f92e-2300-11e8-88ec-31434a3d8fc7.png)

1. Going back to Atom, proceed to toggle debugging on from the **Package** Menu item:

	![Screenshot showing Package menu items](https://user-images.githubusercontent.com/746152/37092536-08f8e4fa-21eb-11e8-8f5c-bcf70029612b.png)

	* Expect to see the debugger console window opening:

	![Screenshot showing debugger console](https://user-images.githubusercontent.com/746152/37092608-3f649e26-21eb-11e8-87b8-02a8ae7e9a98.png)

	* This window will read `Listening on address port 0.0.0.0:9000` until you go to the WordPress site and refresh to make a new request. Then this window will read: `Connected` for a short time until the request ends. Note that it will also remain as such if you had added a breakpoint and the code flow has stopped:

	![Screenshot showing "connected"](https://user-images.githubusercontent.com/746152/37092711-9d8d1fb4-21eb-11e8-93f6-dd1edf89e6fa.png)

1. You should be able to set breakpoints now:

	![Screen animation showing setting a breakpoint](https://user-images.githubusercontent.com/746152/37093212-591fe7d8-21ed-11e8-8352-47839ce58964.gif)

#### Remote debugging with PhpStorm editor

Below are instructions for starting a debug session in PhpStorm that will listen to activity on your Jetpack docker.

1. Configure your browser extension to use 'PHPSTORM' for its session ID.

1. Open your Jetpack project in PhpStorm and chose 'Run -> Edit Configurations' from the main menu.

1. Click the '+' icon, and chose 'PHP Remote Debug' to create a new debug configuration.

1. Name your debug configuration whatever you like.

1. Check the 'Filter debug connection by IDE key', and enter 'PHPSTORM' for 'IDE Key ( Session ID )'.

1. Click the '...' on the 'Server' line to configure your remote server.

1. In the server configuration window, click the '+' icon to create a new server configuration. Name it whatever you like.

1. In the server configuration window, set your host to the URL you use to run Jetpack locally. ( Eg, localhost, or 0.0.0.0, or example.ngrok.io )

1. In the server configuration window, check the 'Use path mappings' checkbox.

1. In the server configuration window, map the main Jetpack folder to '/var/www/html/wp-content/plugins/jetpack' and map '/docker/wordpress' to '/var/www'

1. In the server configuration window, click 'Apply' then 'Ok'.

1. Back in the main configuration window, click 'Apply' then 'Ok'.

1. You can now start a debug session by clicking 'Run -> Debug' in the main menu
