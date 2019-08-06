# Development Environment

The javascript and CSS components of this plugin's admin interface need to be built in order to get the runtime bundle (`_inc/build/admin.js`)

## Before moving forward

In most cases you want to have accessible an WordPress installation for Jetpack development. We suggest to use a `Docker` container which we provide. Follow [this guide](../docker/README.md#to-get-started) to configure your Docker development environment.

**Recommended Environment:**

* Node.js 10
* Yarn 1.7
* PHP 7.2 (in case you are running WordPress locally)
* Composer

## Script for checking if your environment is ready for contributing to Jetpack

We provide a script to help you in assessing if everything's ready on your system to contribute to Jetpack.

```sh
tools/check-development-environment.sh
```

You should expect to get no red `FAILED` check messages. If there happens to be one, you can follow the link mentioned in the status check to see what's needed to address the issue.

## A note on Node versions used for the build tasks

We try to frequently keep the Node version we use up to date. So, eventually you may need to refresh your package dependencies (i.e., the `node_modules` directories). This is because some dependencies are built specifically for the Node version you used when you installed them (either by running `yarn build` or `yarn`).

We recommend usage of [nvm](https://www.npmjs.com/package/nvm) for managing different Node versions on the same environment.

**Note:** If you have previously run the Jetpack build tasks (e.g. `yarn build`), and didn't come back to it for a long time, you can
run this command before building again. Otherwise you may experience errors on the command line while trying to build.

```
$ yarn distclean
```

### Start Development

1. Make sure you have `git`, `node`, `npm`, and a working WordPress installation.
2. Clone this repository inside your Plugins directory.

	```sh
	$ git clone git@github.com:Automattic/jetpack.git
	$ cd jetpack
	```

3. [Install Composer](#installing-composer).
4. Install Yarn. Please, refer to Yarn's [Installation Documentation](https://yarnpkg.com/docs/install/).

5. Make sure the Jetpack plugin is active and run

	```
	$ yarn build
	```

	This will install npm dependencies and then build the files.

6. Open `/wp-admin/admin.php?page=jetpack` in your browser.

## Development build

The development build will create a build without minifying or deduping code. It will also install dependencies for you, so you don't need to `yarn` before it.

```
$ yarn build
```

## Development build with changes monitoring (watch)

You can run a watch process, which will continuously watch the front-end JS and CSS/Sass for changes and rebuild accordingly.
Instead of `yarn build` you'd use `yarn watch`.

```
$ yarn watch
```

## Production build

The production build will generate minified files without duplicated code (resulting from dependencies) and will also generate the matching sourcemap and language files.

```
$ NODE_ENV=production yarn build-client
```

## Unit-testing

Jetpack includes several [unit tests](https://github.com/Automattic/jetpack/tree/master/tests) that you can run in your local environment before submitting a new Pull Request.

To get started, you can follow the instructions [here](https://phpunit.de/getting-started.html) to install PHPUnit on your machine. If you are running a recent version of [VVV](https://github.com/Varying-Vagrant-Vagrants/VVV) then Jetpack will automatically detect your wordpress-develop install and you can just run `phpunit` directly.

Otherwise you'll need to manually install the `wordpress-develop` branch, as follows:

```
svn co https://develop.svn.wordpress.org/trunk/ /tmp/wordpress-develop
cd /tmp/wordpress-develop
cp wp-tests-config-sample.php wp-tests-config.php
```

Set the database information for your testing DB in the file `/tmp/wordpress-develop/wp-tests-config.php`. You may need to create this database.

To run tests on your machine, you can run `phpunit` while in the Jetpack directory.

To run Woocommerce integration tests, you'll need the woocommerce plugin installed alongside Jetpack (in `../woocommerce`), and you can run:

```
JETPACK_TEST_WOOCOMMERCE=1 phpunit
```

To run multisite tests, run:

```
phpunit -c tests/php.multisite.xml
```

To filter and run just a particular test, you can run:

```
phpunit --filter my_test_name
```

If you're not familiar with PHP Unit Testing, you can also check [this tutorial](https://pippinsplugins.com/series/unit-tests-wordpress-plugins/)

## Unit-testing the JS code

Jetpack includes also several [Mocha](https://mochajs.org/) based unit tests.
To execute them in your local environment, you can use the following commands.

### Admin Page unit tests

Standing on your jetpack directory, run

```
$ yarn
$ yarn test-client
$ yarn test-gui
```

### Jetpack modules unit tests

Standing on your jetpack directory, run

```
$ yarn
$ yarn test-modules
```

You can also only run tests matching a specific pattern. To do that, use the argument `-g, --grep <pattern>`:

```
$ yarn test-gui -g 'my custom pattern to filter tests'
```

To use a custom reporter, pass the argument `-R, --reporter <name>`:

```
$ yarn test-client -R 'my_reporter'
```

## Installing Composer

Jetpack includes a number of packages such as the `jetpack-logo` and to use these packages you need Composer, the PHP package manager.

It's also necessary to use the PHP CodeSniffer that ensures your code follows code standards. 

### Installing Composer on macOS

Composer can be installed using [Homebrew](https://brew.sh/). If you don't have Homebrew, install it with

```
/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
```

And then install Composer:

```
brew install composer
```

### Installing Composer on other systems

We recommend visiting the [official Composer download instructions](https://getcomposer.org/download/) to install composer on other operating systems. 

Most Linux distributions may have an older version of Composer as an installable package, but installing from the official source ensures you have the most up to date version.
Note that [we recommend using the Windows Subsystem for Linux](#developing-and-contributing-code-to-jetpack-from-a-windows-machine) to run Composer and PHP.

## Use PHP CodeSniffer and ESLint to make sure your code respects coding standards

We strongly recommend that you install tools to review your code in your IDE. It will make it easier for you to notice any missing documentation or coding standards you should respect. Most IDEs display warnings and notices inside the editor, making it even easier.

- You can find [Code Sniffer rules for WordPress Coding Standards](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) here. Once you've installed these rulesets, you can [follow the instructions here](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#how-to-use) to configure your IDE.
- For JavaScript, we recommend installing ESLint. Most IDEs come with an ESLint plugin that you can use. Jetpack includes a `.eslintrc.js` file that defines our coding standards.

### Linting Jetpack's PHP

You can easily run these commands to set up all the rulesets and then lint Jetpack's PHP code. You need Composer to run this tool so check how to [install Composer](#installing-composer) if you don't have it yet.

This will install all the CodeSniffer rulesets we need for linting Jetpack's PHP code. You may need to do this only once.

```sh
$ composer install
```

This runs the actual linting task.

```sh
$ composer php:lint
```

_There's also a handy `yarn php:lint` that will run `composer php:lint` if you prefer_.

```sh
$ yarn php:lint
```

### Checking Jetpack's PHP for compatibility with different versions of PHP since 5.2

We have a handy `composer` script that will just run the PHP CodeSniffer `PHPCompatibilityWP` ruleset checking for code not compatible with PHP 5.2

```sh
$ composer php:compatibility .
```

_There's also a handy `yarn php:compatibility` that will run `composer php:compatibility` if you prefer_.

```sh
$ yarn php:compatibility .
```

### Linting Jetpack's JavaScript

`yarn lint` will check syntax and style in the following JavaScript pieces:

* All the frontend JavaScript that Jetpack relies on.
* All the JavaScript present in the Admin Page Single Page App for Jetpack.

```sh
$ yarn lint
```

_If you haven't done it yet, you may need to run `yarn` before `yarn lint` for installing node modules for this task_.

## Developing and contributing code to Jetpack from a Windows machine

When working on a Windows machine, you can use [Windows Subsystem for Linux](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux). You may, however, run into issues when you want to commit your changes. In this case, and if you use an IDE like PHPStorm, you can follow the recommendations in [this post](https://alex.blog/2018/02/21/guide-to-having-phpstorm-use-windows-subsystem-for-linux-git/) to have PhpStorm Use Windows Subsystem For Linux’s Git.

## Developing with docker

We provide a standard installation of WordPress for making Jetpack development easier.

You can read the details in [docker/README.md](../docker/README.md)

## Standard Development/debug Tools

### WP_DEBUG

You should do all Jetpack development with `define( 'WP_DEBUG', true );` in your `wp-config.php`, making sure that you’re not generating any Notices or other PHP issues in your error_log.

### SCRIPT_DEBUG

By default, WordPress loads minified versions of Jetpack's JS files. If you want to work with them, add `define( 'SCRIPT_DEBUG', true );` in your `wp-config.php`. This tells WordPress to load the non-minified JS version, allowing you to see your changes on page refresh. This applies to the JS files outside of `_inc/client/` and `extensions/`.

### WP-CLI

Jetpack CLI is a command line interface for Jetpack, extending off of wp-cli for WordPress. You can easily modify your installation of Jetpack with a just a few simple commands. All you need is SSH access and a basic understanding of command line tools.

Usage:

* `wp jetpack status [<full>]`
* `wp jetpack module <list|activate|deactivate|toggle> [<module_name>]`
* `wp jetpack options <list|get|delete|update> [<option_name>] [<option_value>]`
* `wp jetpack protect <whitelist> [<ip|ip_low-ip_high|list|clear>]`
* `wp jetpack reset <modules|options>`
* `wp jetpack disconnect <blog|user> [<user_identifier>]`
* `wp jetpack status`
* `wp jetpack status [<full>]`

More info can be found in [our support documentation](https://jetpack.com/support/jetpack-cli/).

### JETPACK_DEV_DEBUG

`JETPACK_DEV_DEBUG` constant can be used to enable development mode in Jetpack. Add `define( 'JETPACK_DEV_DEBUG', true );` in your `wp-config.php` to enable it. With Development Mode, features that do not require a connection to WordPress.com servers can be activated on a local WordPress installation for testing.

Development mode automatically gets enabled if you don’t have a period in your site’s hostname, i.e. localhost. If you use a different URL, such as mycooltestsite.local, then you will need to define the `JETPACK_DEV_DEBUG` constant.

You can also enable Jetpack’s development mode through a plugin, thanks to the jetpack_development_mode filter:

`add_filter( 'jetpack_development_mode', '__return_true' );`

While in Development Mode, some features will not be available at all as they require WordPress.com for all functionality—Related Posts and Publicize, for example. Other features will have reduced functionality to give developers a good-faith representation of the feature. For example, Tiled Galleries requires the WordPress.com Photon CDN; however, in Development Mode, Jetpack provides a fallback so developers can have a similar experience during development and testing. Find out more in [our support documentation](https://jetpack.com/support/jetpack-for-developers/).

### JETPACK__SANDBOX_DOMAIN

External contributors do not need this constant.
If you’re working on changes to the WordPress.com/server side of Jetpack, you’ll need to instruct your Jetpack installation to talk to your development server. Refer to internal documentation for detailed instructions.
