# Docker environment for Jetpack Development

Unified environment for developing Jetpack using Docker containers providing following goodies:

* An Ubuntu base operating system.
* Latest stable version of WordPress.
* All monorepo plugins will be available as plugins within the Docker WP instance.
* Xdebug setup.
* WP-CLI installed.
* MailDev to catch all the emails leaving WordPress so that you can observe them from browser.
* phpMyAdmin to aid in viewing the database.
* Handy shorthand commands like `jetpack docker up` and `jetpack docker phpunit` to simplify the usage.

## To get started

### Prerequisites

To use Jetpack's Docker environment, you will need:

- A [local copy of the Jetpack repository](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#clone-the-repository).
- [Docker](https://hub.docker.com/search/?type=edition&offering=community) installed and running.
- [Jetpack's required tools](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md#install-development-tools).

Our Docker instance comes with a default settings file. You can modify those defaults by copying the file:

```sh
cp tools/docker/default.env tools/docker/.env
```

Anything you put in `.env` overrides values in `default.env`. You should modify all the password fields for security, for example.

**Note**: in older versions of docker-compose (earlier than 1.28), you'll need to place that file at the root of the monorepo.

## Quick start

Once you're all set with the above, spin up the containers:
```sh
jetpack docker up
```

Non-installed WordPress is running at [http://localhost](http://localhost) now. To install WordPress and configure some useful defaults, run
```sh
jetpack docker install
```

At this point, to connect Jetpack, you'd need to set up a service that can create local HTTP tunnels, such as [the Jurassic Tube Tunneling Service](#jurassic-tube-tunneling-service) (available to Automatticians only), [ngrok](#using-ngrok-with-jetpack), or [another similar service](https://alternativeto.net/software/ngrok/).
With such a service, your site will be publicly accessible and you will be able to connect Jetpack to WordPress.com.

**Warning: These solutions create a public tunnel to your system. You should only activate the tunnel while actively needing it and deactivate when you are finished.**

_You are now ready to login to your new WordPress install and connect Jetpack, congratulations!_

You should follow [Jetpack’s development documentation](../../docs/development-environment.md#development-workflow) for installing Jetpack’s dependencies and building files. Docker setup does not build these for you.

## Good to know

WordPress’ `WP_SITEURL` and `WP_HOME` constants are configured to be dynamic in `./tools/docker/wordpress/wp-config.php` so you shouldn’t need to change these even if you access the site via different domains.

## Custom mounts, environment Variables, `.env` Files, and Ports

You can control some of the behavior of Jetpack's Docker configuration with environment variables. Note, though, that there are two types of environments:
1. The host environment in which the `jetpack docker *` (`docker-compose`) commands run when creating/managing the containers.
2. The containers' environments.

### Host Environment

You can set the following variables on a per-command basis (`PORT_WORDPRESS=8000 jetpack docker up`) or, preferably, in the `tools/docker/.env` file you set up earlier.

* `PORT_WORDPRESS`: (default=`80`) The port on your host machine connected to the WordPress container's HTTP server.
* `PORT_MAILDEV`: (default=`1080`) The port on your host machine connected to the MailDev container's MailDev HTTP server.
* `PORT_SMTP`: (default=`25`) The port on your host machine connected to the MailDev container's SMTP server.
* `PORT_SFTP`: (default=`1022`) The port on your host machine connected to the SFTP container's SFTP server.

### Container Environments

Configurable settings are documented in the [`./tools/docker/default.env` file](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/default.env).
Customizations should go into a `./tools/docker/.env` file you create, though, not in the `./tools/docker/default.env` file.

### Docker configurations

Jetpack Docker provides two types of configurations: `dev` and `e2e`. These configurations define lists of services to start, volumes to map, etc. Both of them extend default configuration `tools/docker/docker-compose.yml` via the config file: `tools/docker/jetpack-docker-config-default.yml`.

* `dev` configuration is used by default, and is aimed for Jetpack development.
* `e2e` configuration is created specifically for Jetpack E2E tests.

Users can extended these configurations further via override config file `tools/docker/jetpack-docker-config.yml`, which is git-ignored.

#### Jetpack Docker config structure

The default config file `tools/docker/jetpack-docker-config-default.yml` includes inline comments explaining the structure of config, but here's quick overview. The configuration is grouped per environment type: `default`, `dev`, `e2e`. Each type may define `volumeMappings` and `extras`:

* `volumeMappings` - list of key value pairs which defines local directory mappings with following structure: local_path: wordpress_container_path
* `extras` - basically any other configuration that is supported by `docker-compose`

## Working with containers

### Quick install WordPress

You can just quickly install WordPress and activate Jetpack via command line. Ensure you have your domain modified in `.env` file, spin up the containers and then run:

```sh
jetpack docker install
```

This will give you a single site with user/pass `wordpress` (unless you changed these from `./tools/docker/.env` file). You will still have to connect Jetpack to WordPress.com manually.

To convert installed single site into a multisite, run:

```sh
jetpack docker multisite-convert
```

To remove WordPress installation and start over, run:

```sh
jetpack docker uninstall
```

### Start containers

```sh
jetpack docker up
```

Start the containers (WordPress, MySQL and MailDev) defined in `docker-compose.yml`.

This command will rebuild the WordPress container if you made any changes to `docker-compose.yml`.

For running the containers in the background, use:

```sh
jetpack docker up -d
```

### Stop containers

```sh
jetpack docker stop
```

Stops all containers.

```sh
jetpack docker down
```

Will stop all of the containers created by this docker-compose configuration and remove them, too. It won’t remove the images. Just the containers that have just been stopped.

### Running unit tests

These commands require the WordPress container to be running.

```sh
jetpack docker phpunit
```

This will run unit tests for Jetpack. You can pass arguments to `phpunit` like so:

```sh
jetpack docker phpunit -- --filter=Protect
```

This command runs the tests as a multi site install
```sh
jetpack docker phpunit-multisite -- --filter=Protect
```

To run tests for specific packages, you can run the tests locally, from within the package's directory:
```sh
cd projects/packages/assets
composer phpunit
```

### Starting over

To remove all docker images, all MySQL data, and all docker-related files from your local machine run:

```sh
jetpack docker clean
```

**Note:** this command does not work in Windows.

### Using WP CLI

You can run [WP CLI](https://make.wordpress.org/cli/) commands inside WordPress container:

```sh
jetpack docker wp COMMAND
```

For example run [`cron event list`](https://developer.wordpress.org/cli/commands/cron/event/list/):

```sh
jetpack docker wp cron event list
```

[`shell`](https://developer.wordpress.org/cli/commands/shell/) is a handy WP-CLI command you can use like so:

```bash
jetpack docker wp shell
```

By default it will use rich REPL [`PsySH`](https://psysh.org/), to run the default REPL use `jetpack docker wp shell --basic`

Shell allows you to evaluate PHP code while having your installed WordPress loaded, so you could do things like:

```
wp> get_bloginfo( 'name' );
=> string(6) "WP-CLI"
```

Note that each `wp shell` session counts as a single request, causing unexpected situations with WP cache. You might want to run [`wp_cache_flush()`](https://developer.wordpress.org/reference/functions/wp_cache_flush/) between requests you expect to get cached by WordPress.

## MySQL database

You can see your database files via local file system at `./tools/docker/data/mysql`

You can also access it via phpMyAdmin at [http://localhost:8181](http://localhost:8181).

Another way to accessing the database is MySQL client using the following command:
```sh
jetpack docker db
```
This command utilizes credentials from the config file (`~/.my.cnf`) to log you into MySQL without entering any connection information.

## SFTP access

You can access WordPress and Jetpack files via SFTP server container.

- Host: `localhost`
- Port: `1022`
- User: `wordpress`
- Pass: `wordpress`
- WordPress path: `/var/www/html`

You can tunnel to this container using [Ngrok](https://ngrok.com) or [other similar service](https://alternativeto.net/software/ngrok/). If you intend to do so, change the password in the `SFTP_USERS` variable in `./tools/docker/.env`!

Tunnelling makes testing [Jetpack Backup & Scan](https://jetpack.com/support/backup/) possible. Read more from ["Using Ngrok with Jetpack"](#using-ngrok-with-jetpack) section below.

### SFTP keys

To allow SFTP login using a key, place the public key files (e.g. `id_rsa.pub`) in `./tools/docker/data/ssh.keys`.

## Must Use Plugins directory

You can add your own PHP code to `./tools/docker/mu-plugins` directory and they will be loaded by WordPress, in alphabetical order, before normal plugins, meaning API hooks added in an mu-plugin apply to all other plugins even if they run hooked-functions in the global namespace. Read more about [must use plugins](https://codex.wordpress.org/Must_Use_Plugins).

You can add your custom Jetpack constants (such as `JETPACK__SANDBOX_DOMAIN`) to a file under this folder. Automattic engineers can use this to sandbox their environment:

```
define( 'JETPACK__SANDBOX_DOMAIN', '{your sandbox}.wordpress.com' );
```

## Jurassic Tube Tunneling Service

This is for Automatticians only. More information: PCYsg-snO-p2.

If you have persistent trouble with the `jetpack docker jt-*` commands complaining that "Tunneling scripts are not installed", it could be because Docker wasn't running properly when you ran the installer.

To solve this problem, run these commands from the repo root:

```
jetpack docker up -d
chmod +x tools/docker/bin/jt/installer.sh && tools/docker/bin/jt/installer.sh
```

Once you have successfull installed Jurassic Tube, you can use these commands during development:

* Start the tunnel: `jetpack docker jt-up your-username your-subdomain`
* Break the connection: `jetpack docker jt-down`

You can also set default values:

```shell script
jetpack docker jt-config username your-username
jetpack docker jt-config subdomain your-subdomain
```
That will let you omit those parameters while initiating the connection:
```shell script
jetpack docker jt-up
```

## Using Ngrok with Jetpack

Note: While Ngrok is technically supported for everyone, Jurassic Tube is used by the Jetpack team and is available to all Automatticians.

To be able to connect Jetpack you will need a domain - you can use [Ngrok.com](https://ngrok.com/) to assign one.

If you use one-off domains, you'll have to re-install WordPress and re-connect Jetpack each time you close Ngrok (thus losing your randomly assigned domain). That's perfectly fine for quick testing or lightweight development. You can use [other similar services](https://alternativeto.net/software/ngrok/) as well.

If you're developing Jetpack often you'll want to reserve a domain you can keep using.

If you are an Automattician, we no longer have SSO access to Ngrok. To get the ability to re-use domains, reserve your custom domains, and reserve TCP ports, you'll need to sign up for the plan you need and expense the yearly fee.

[Go to this page to reserve a permanent domain](https://dashboard.ngrok.com/reserved).

Once you’ve done that, follow [these steps](https://ngrok.com/download) to download and set up ngrok. However, instead of step four, edit your [config file](https://ngrok.com/docs#default-config-location) as explained below:

```
authtoken: YOUR_AUTH_TOKEN # This should already be here
region: eu # only needed for subdomains in Europe (eu), Asia/Pacific (ap) or Australia (au)
tunnels:
  jetpack:
    subdomain: YOUR_RESERVED_SUBDOMAIN # without the .ngrok.io
    addr: 80
    proto: http
```

ngrok support is integrated into a jetpack cli, so to start a docker container with mapped tunnel, simply run:
```bash
jetpack docker up --ngrok
```

### Ngrok SFTP Tunnel with Jetpack
A sample config for adding an sftp tunnel to your Ngrok setup would look like this:

```
authtoken: YOUR_AUTH_TOKEN
tunnels:
  jetpack:
    subdomain: YOUR_PERMANENT_SUBDOMAIN
    addr: 80
    proto: http
  jetpack-sftp:
    addr: 1022
    proto: tcp
    remote_addr: 0.tcp.ngrok.io:YOUR_RESERVED_PORT
```

See more configuration options from [Ngrok documentation](https://ngrok.com/docs#tunnel-definitions).

You can now start both tunnels:
```bash
jetpack docker up --ngrok sftp
```

You can inspect traffic between your WordPress/Jetpack container and WordPress.com using [the inspector](https://ngrok.com/docs#inspect).

### Configuring Jetpack Backup & Scan with Ngrok tunnel

You should now be able to configure [Jetpack Backup & Scan](https://jetpack.com/support/backup/) credentials point to your Docker container:

- Credential Type: `SSH/SFTP`
- Server Address: `0.tcp.ngrok.io`
- Port Number: `YOUR_RESERVED_PORT`
- Server username: `wordpress`
- Server password: `wordpress`
- WordPress installation path: `/var/www/html`

## Custom plugins & themes in the container

Jetpack Docker environment can be wonderful for developing your own plugins and themes, too.

Since everything under `mu-plugins` and `wordpress/wp-content` is git-ignored, you'll want to keep those folders outside Jetpack repository folder and link them as volumes to your Docker instance.

1. First ensure your containers are stopped (`jetpack docker stop`).
2. Edit `tools/docker/jetpack-docker-config.yml`. Changes to this file won't be tracked by git.
3. To add a single custom plugin, you would for example have this in that file:
    ```yml
    default:
      # Volumes to mount inside the environment. Keys are the local paths, which may be absolute
      # or relative to the monorepo root. Values are the paths inside the Docker environment, and
      # must be absolute.
      volumeMappings:
        ## Gutenberg
        /Users/you/code/gutenberg: /var/www/html/wp-content/plugins/gutenberg
   ```
4. Start containers and include your custom volumes by running:
   ```bash
   jetpack docker up
   ```

Note that any folder within the `projects/plugins` directory will be automatically linked.
If you're starting a new monorepo plugin, you may need to `jetpack docker stop` and `jetpack docker up` to re-run the initial linking step so it can be added.

## Debugging

### Accessing logs

Logs are stored in your file system under `./tools/docker/logs` directory.

#### PHP error log

To `tail -f` the PHP error log, run:

```sh
jetpack docker tail
```

#### MySQL Slow Query Log

The MySQL Server is configured to log any queries that take longer than 0.5 second to execute.

Path to the slow query log: `tools/docker/logs/mysql/slow.log`.

We recommend to regularly review the log to make sure performance issues don't go unnoticed.

### Debugging emails

Emails don’t leave your WordPress and are caught by [MailDev](http://danfarrelly.nyc/MailDev/) SMTP server container instead.

To debug emails via web-interface, open [http://localhost:1080](http://localhost:1080)


### Debugging different WordPress versions

You can use the [WP CLI](https://make.wordpress.org/cli/) to update the version of WordPress running inside the Docker container. Example command:

```
jetpack docker wp core update --version=5.3.4 --force
```

This is useful if you want to check your code is compatible with the minimum version of WP Jetpack supports, which can be found in the [readme.txt](../readme.txt). We always support the latest patched version of the branch we specify as "Requires at least" in the readme file. You can match it with the exact version on the [WordPress Releases page](https://wordpress.org/download/releases/).

### Debugging PHP with Xdebug

The WordPress image is leveraged with Xdebug present as a PHP Extension.

You’ll likely need to install a browser extension like the following:

* [The easiest Xdebug](https://addons.mozilla.org/en-US/firefox/addon/the-easiest-xdebug/) for Mozilla Firefox
* [Xdebug Helper](https://chrome.google.com/webstore/detail/xdebug-helper/eadndfjplgieldjbigjakmdgkmoaaaoc) for Google Chrome

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

1. In the server configuration window, check the 'Use path mappings' check box.

1. In the server configuration window, map the root folder to '/usr/local/src/jetpack-monorepo' and 'tools/docker/wordpress' to '/var/www/html'.

1. In the server configuration window, click 'Apply' then 'Ok'.

1. Back in the main configuration window, click 'Apply' then 'Ok'.

1. You can now start a debug session by clicking 'Run -> Debug' in the main menu

#### Remote Debugging with VSCode

You'll need:

- [PHP Debug](https://marketplace.visualstudio.com/items?itemName=felixfbecker.php-debug) plugin installed in VSCode
- If you use Google Chrome, install the [Xdebug Helper](https://chrome.google.com/webstore/detail/xdebug-helper/eadndfjplgieldjbigjakmdgkmoaaaoc?hl=en) extension.
- If you use Firefox, install [Xdebug Helper](https://addons.mozilla.org/en-GB/firefox/addon/xdebug-helper-for-firefox/) add-on.

##### Set up the Debugging Task

In the debug panel in VSCode, select Add Configuration. Since you have PHP Debug installed, you'll have the option to select "PHP" from the list. This will create a `.vscode` folder in the project root with a `launch.json` file in it.

You will need to supply a pathMappings value to the `launch.json` configuration. This value connects the debugger to the volume in Docker with the Jetpack code. Your `launch.json` file should have this configuration when you're done.

```json
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Listen for Xdebug",
            "type": "php",
            "request": "launch",
            "port": 9003,
            "pathMappings": {
                "/usr/local/src/jetpack-monorepo": "${workspaceRoot}",
                "/var/www/html": "${workspaceRoot}/tools/docker/wordpress",
            }
        },
        {
            "name": "Launch currently open script",
            "type": "php",
            "request": "launch",
            "program": "${file}",
            "cwd": "${fileDirname}",
            "port": 9003
        }
    ]
}
```

In your browser's Xdebug Helper preferences, look for the IDE Key setting:

1. Select 'Other'
2. Add `VSCODE` as the key.
3. Save.

##### Run the debugger

- Set a break point in a PHP file, for example in the `init()` function of `class.jetpack.php`.
- Select 'Debug' on the browser extension.
- Click 'play' in VSCode's debug panel
- Refresh the page at localhost

For more context on remote debugging PHP with VSCode, see [this article](https://medium.com/@jasonterando/debugging-with-visual-studio-code-xdebug-and-docker-on-windows-b63a10b0dec).

### Profiling requests in your Sandbox using XDEBUG

If you want to profile requests to your Sandbox using XDEBUG (See PCYsg-21A-p2), you'll need to hook into the `jetpack_sandbox_add_profile_parameter` filter to add the `XDEBUG_PROFILE` parameter to the requests:

```PHP
add_filter( 'jetpack_sandbox_add_profile_parameter', '__return_true' );
```

The above will add the parameter to every request. If you want, you can narrow it down and add it only to certain requests:

```PHP
add_filter( 'jetpack_sandbox_add_profile_parameter', 'my_plugin_add_profile_parameter', 10, 3 );

function my_plugin_add_profile_parameter( $should_add, $url, $host ) {
	// parse the $url and $host the way you want
	if ( $meets_my_criteria ) {
		return true;
	}
	return $should_add;
}
```
