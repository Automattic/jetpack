# Development Environment

## Table of contents

* [Setting up your environment](#setting-up-your-environment)
   * [Overview](#overview)
   * [Running Jetpack locally](#running-jetpack-locally)
      * [Docker (Recommended)](#docker-supported-recommended)
      * [VVV](#vvv)
      * [Local web and database servers](#local-web-and-database-servers)
      * [Developing and contributing code to Jetpack from a Windows machine](#developing-and-contributing-code-to-jetpack-from-a-windows-machine)
   * [Installing development tools](#installing-development-tools)
	  * [Quick way to check if your environment is ready for Jetpack development](#quick-way-to-check-if-your-environment-is-ready-for-jetpack-development)
      * [NodeJS](#nodejs)
      * [Yarn package manager](#yarn)
      * [PHP](#php)
      * [Composer](#composer)
      * [PHPUnit](#phpunit)
* [Start development](#development-workflow)
   * [Run a development build](#development-build)
   * [Run production build](#production-build)
* [Unit Testing](#unit-testing)
   * [PHP unit testing](#php-unit-tests)
   * [JavaScript unit testing](#javascript-unit-tests)
* [Good code - linting, standards, compatibilty, etc.](#good-code---linting-standards-compatibilty-etc)
	* [Coding standards](#coding-standards)
	* [Linting](#linting)
* [Standard development & debugging tools](#standard-development--debugging-tools)

# Setting up your environment

## Overview 

In order to start developing the Jetpack plugin you want to have access to a WordPress installation where you can install the plugin and work on it. 

To do that you need to set up a WordPress site and give it the ability to run your local build of the Jetpack plugin code repository.

There are several ways to achieve this, listed in the next section.

## Running Jetpack locally

To get a local WordPress site up and running you need a web server (Apache, Nginx), PHP and MySQL (or MariaDB).

**Important:** Docker is the only solution that we recommend and can provide support for. The others are listed here as reference if you want to try something different. We won't be able to provide support for them 

* ### Docker (Supported Recommended)

	This would be the easiest and most straight-forward way to start your journey in Jetpack development. Docker offers a containerized install of WordPress with all of its dependencies installed and set up. You just need to start working on the plugin code. 
	
	To set up your environment with Docker, follow the [Docker environment for Jetpack Development guide](../docker/README.md).

* ### VVV

	VVV is similar to Docker in how it works, but instead of setting up separate containers for the different parts it uses a single Linux virtual machine to set everything up with a nice interface.
	
	You can read up more about setting up VVV on [the project's official page](https://varyingvagrantvagrants.org/). 
	
* ### Local web and database servers 
	
	This is the most involved set up way among the three. Since the installation steps are very dependent on the operating system and it's flavor, we're not going to cover them here for the time being. You can refer to the [WordPress recommended system requirements](https://wordpress.org/about/requirements/) to see what you need to install to get WordPress up and running on your system.

* ### Developing and contributing code to Jetpack from a Windows machine
	
	When working on a Windows machine, you can use [Windows Subsystem for Linux](https://en.wikipedia.org/wiki/Windows_Subsystem_for_Linux). You may, however, run into issues when you want to commit your changes. In this case, and if you use an IDE like PHPStorm, you can follow the recommendations in [this post](https://alex.blog/2018/02/21/guide-to-having-phpstorm-use-windows-subsystem-for-linux-git/) to have PhpStorm Use Windows Subsystem For Linux’s Git.

## Installing development tools

### Minimum required versions
 * Node.js - LTS
 * Yarn - 1.7
 * PHP - 7.4 (in case you're running WordPress locally)

---

### Quick way to check if your environment is ready for Jetpack development

We provide a script to help you in assessing if everything's ready on your system to contribute to Jetpack.

```sh
tools/check-development-environment.sh
```

Running the script will tell you if you have your environment already set up and what you need to do in order to get it ready for Jetpack development.

If you're ready to start, you should see all green `SUCCESS` messages. If the script detect issues, you will see a a red `FAILED` note and a link that will help you figure out what you need to change/fix to address the issue.

## Tools

* ### Node.js

	Node.js is used in the build process of the Jetpack plugin. If it's not already installed on your system, you can [visit the Node.js website and install the latest Long Term Support (LTS) version.](https://nodejs.org/).

* ### Yarn

	Yarn is a Node.js package manager and it's used to install packages that are required to build the Jetpack plugin. To install it, you can [visit the Installation page of the project](https://yarnpkg.com/getting-started/install) and follow the instructions for your operating system.

* ### PHP

	PHP is a popular general-purpose scripting language that is especially suited to web development and it's at the core of the Jetpack plugin. 
	
	There are multiple ways to install PHP on your operating system, but as it's very dependent on your operating system and it's flavor, we're not going to cover it in this document at this time. 
	
	You can check out the [official installation instructions from the project website.](https://www.php.net/manual/en/install.php).

* ### Composer

	Jetpack includes a number of packages such as the `jetpack-logo` and to use these packages you need Composer, the PHP package manager.
	
	It's also necessary to use the PHP CodeSniffer that ensures your code follows code standards. 
	
	 * #### Installing Composer on macOS
	
		Composer can be installed using [Homebrew](https://brew.sh/). If you don't have Homebrew, install it with
		
		```sh
		/usr/bin/ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"
		```
	
		And then install Composer:
	
		```sh
		brew install composer
		```
	
	 * #### Installing Composer on other systems
	
		We recommend visiting the [official Composer download instructions](https://getcomposer.org/download/) to install composer on other operating systems. 
		
		Most Linux distributions may have an older version of Composer as an installable package, but installing from the official source ensures you have the most up to date version.
		Note that [we recommend using the Windows Subsystem for Linux](#developing-and-contributing-code-to-jetpack-from-a-windows-machine) to run Composer and PHP.

* ### PHPUnit

	PHPUnit is the unit test framework we use in Jetpack. You can install it by [visiting the official project web site](https://phpunit.de/) and follow the installation instructions there. 

# Development workflow

To start work on the Jetpack plugin you need to follow these steps:

1. [Clone the repository](#clone-the-repository)
2. [Install the development tools](#installing-development-tools)
3. Make sure Jetpack is enabled on your WordPress site
4. [Build Jetpack](#building-jetpack)
5. Open `/wp-admin/admin.php?page=jetpack` in your browser.

## Clone the repository

Make sure you have `git`, `node`, `yarn`, and a working WordPress installation.
Clone this repository inside your Plugins directory.
	
```sh
git clone git@github.com:Automattic/jetpack.git
cd jetpack
```
	
 You'll need to have a public SSH key setup with GitHub, which is more secure than saving your password in your keychain.
 There are more details about [setting up a public key on GitHub.com](https://help.github.com/en/articles/adding-a-new-ssh-key-to-your-github-account).

## Building Jetpack

To work on Jetpack you need to build the JavaScript and CSS components of the plugin's admin interface. This will generate the run time bundle (`_inc/build/admin.js`)

There are three types of builds:

* ### Development build
	The standard development build will create un-minified versions of the JavaScript and CSS files. To build Jetpack like this run:
	
	```sh
	yarn build
	```
	
* ### Continuous Development build
	By default the development build above will run once and if you change any of the files, you need to run `yarn build` again to see the changes on the site. If you want to avoid that, you can run a continuous build that will rebuild anytime it sees any changes on your local filesystem. To run it, use:
	
	```sh
	yarn watch
	```	

* ### Production build
	The production build will generate minified files without duplicated code (resulting from dependencies) and will also generate the matching source map and language files. To build it use:
	
	```sh
	yarn build-production-client
	```

### A note on building Jetpack and Node.js versions

We try to frequently keep the Node version we use up to date. So, eventually you may need to refresh your package dependencies (i.e., the `node_modules` directories). This is because some dependencies are built specifically for the Node version you used when you installed them (either by running `yarn build` or `yarn`).

We recommend usage of [nvm](https://github.com/nvm-sh/nvm/) for managing different Node versions on the same environment.

**Note:** If you have previously run the Jetpack build tasks (e.g. `yarn build`), and didn't come back to it for a long time, you can
run this command before building again. Otherwise you may experience errors on the command line while trying to build.

```sh
yarn distclean
```

### Building additional Jetpack extensions

Jetpack contains several extensions that have a separate build process. You can find information how to build them below: 

* Jetpack Instant Search - [build instructions](../modules/search/instant-search/README.md)
* Jetpack Block Editor Extensions - [build instructions](../extensions/README.md)

---

# Unit-testing


Jetpack includes several [unit tests](https://github.com/Automattic/jetpack/tree/master/tests) that you can run in your local environment before submitting a new Pull Request.

If you're not familiar with PHP Unit Testing, you can also check [this tutorial](https://pippinsplugins.com/series/unit-tests-wordpress-plugins/)

To get started, there are several ways to run the unit tests, depending on how you set up your development environment.

## PHP unit tests

* ### Docker

	To run the PHP unit tests for Jetpack if you're running Docker, you can run the following:
	
	```sh
	yarn docker:phpunit
	```
	
	This will run unit tests for Jetpack. You can pass arguments to phpunit like so:
	
	```sh
	yarn docker:phpunit --filter=Protect
	```
	
	This command runs the tests as a multi site install
	
	```sh
	yarn docker:phpunit:multisite --filter=Protect
	```

* ### VVV & Local Installs

	If you are running a recent version of [VVV](https://github.com/Varying-Vagrant-Vagrants/VVV) then Jetpack will automatically detect your wordpress-develop install and you can just run `phpunit` directly.
	
	Otherwise you'll need to manually install the `wordpress-develop` branch, as follows:
	
	```sh
	svn co https://develop.svn.wordpress.org/trunk/ /tmp/wordpress-develop
	cd /tmp/wordpress-develop
	cp wp-tests-config-sample.php wp-tests-config.php
	```
	
	Set the database information for your testing DB in the file `/tmp/wordpress-develop/wp-tests-config.php`. You may need to create this database.
	
	To run tests on your machine, you can run `phpunit` while in the Jetpack directory.
	
	To run WooCommerce integration tests, you'll need the WooCommerce plugin installed alongside Jetpack (in `../woocommerce`), and you can run:
	
	```sh
	JETPACK_TEST_WOOCOMMERCE=1 phpunit
	```
	
	To run multisite tests, run:
	
	```sh
	phpunit -c tests/php.multisite.xml
	```
	
	To filter and run just a particular test, you can run:
	
	```sh
	phpunit --filter my_test_name
	```

## JavaScript unit tests

Jetpack includes also several [Mocha](https://mochajs.org/) based unit tests.
To execute them in your local environment, you can use the following commands.

* ### Admin Page unit tests

	Standing on your jetpack directory, run
	
	```sh
	yarn
	yarn test-client
	yarn test-gui
	```

* ### Jetpack modules unit tests

	Standing on your jetpack directory, run
	
	```sh
	yarn
	yarn test-modules
	```
	
	You can also only run tests matching a specific pattern. To do that, use the argument `-g, --grep <pattern>`:
	
	```sh
	yarn test-gui -g 'my custom pattern to filter tests'
	```
	
	To use a custom reporter, pass the argument `-R, --reporter <name>`:
	
	```sh
	yarn test-client -R 'my_reporter'
	```

# Good code - linting, standards, compatibility, etc.

## Coding standards

We strongly recommend that you install tools to review your code in your IDE. It will make it easier for you to notice any missing documentation or coding standards you should respect. Most IDEs display warnings and notices inside the editor, making it even easier.

- You can find [Code Sniffer rules for WordPress Coding Standards](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) here. Once you've installed these rulesets, you can [follow the instructions here](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#how-to-use) to configure your IDE.
- For JavaScript, we recommend installing ESLint. Most IDEs come with an ESLint plugin that you can use. Jetpack includes a `.eslintrc.js` file that defines our coding standards.

## Linting

* ### Linting Jetpack's PHP code

	You can easily run these commands to set up all the rulesets and then lint Jetpack's PHP code. You need Composer to run this tool so check how to [install Composer](#composer) if you don't have it yet.
	
	This will install all the CodeSniffer rulesets we need for linting Jetpack's PHP code. You may need to do this only once.
	
	```sh
	composer install
	```
	
	This runs the actual linting task.
	
	```sh
	yarn php:lint
	```

* ### Checking Jetpack's PHP for compatibility with different versions of PHP since 5.6

	We have a handy `composer` script that will just run the PHP CodeSniffer `PHPCompatibilityWP` ruleset checking for code not compatible with PHP 5.6
	
	```sh
	yarn php:compatibility
	```

* ### Linting Jetpack's JavaScript
	
	`yarn lint` will check syntax and style in the following JavaScript pieces:
	
	* All the front end JavaScript that Jetpack relies on.
	* All the JavaScript present in the Admin Page Single Page App for Jetpack.
	
	```sh
	yarn lint
	```
	
	_If you haven't done it yet, you may need to run `yarn` before `yarn lint` for installing node modules for this task_.

---

# Standard development & debugging tools

* ### WP_DEBUG
	
	You should do all Jetpack development with `define( 'WP_DEBUG', true );` in your `wp-config.php`, making sure that you’re not generating any Notices or other PHP issues in your error_log.

* ### SCRIPT_DEBUG
	
	By default, WordPress loads minified versions of Jetpack's JS files. If you want to work with them, add `define( 'SCRIPT_DEBUG', true );` in your `wp-config.php`. This tells WordPress to load the non-minified JS version, allowing you to see your changes on page refresh. This applies to the JS files outside of `_inc/client/` and `extensions/`.

* ### WP-CLI

	Jetpack CLI is a command line interface for Jetpack, extending off of WP-CLI for WordPress. You can easily modify your installation of Jetpack with a just a few simple commands. All you need is SSH access and a basic understanding of command line tools.
	
	Usage:
	
	* `wp jetpack status [<full>]`
	* `wp jetpack module <list|activate|deactivate|toggle> [<module_name>]`
	* `wp jetpack options <list|get|delete|update> [<option_name>] [<option_value>]`
	* `wp jetpack protect <allow> [<ip|ip_low-ip_high|list|clear>]`
	* `wp jetpack reset <modules|options>`
	* `wp jetpack disconnect <blog|user> [<user_identifier>]`
	* `wp jetpack status`
	* `wp jetpack status [<full>]`
	
	More info can be found in [our support documentation](https://jetpack.com/support/jetpack-cli/).

* ### JETPACK_DEV_DEBUG

	`JETPACK_DEV_DEBUG` constant can be used to enable offline mode in Jetpack. Add `define( 'JETPACK_DEV_DEBUG', true );` in your `wp-config.php` to enable it. With Offline Mode, features that do not require a connection to WordPress.com servers can be activated on a local WordPress installation for testing.
	
	Offline mode automatically gets enabled if you don’t have a period in your site’s hostname, i.e. localhost. If you use a different URL, such as mycooltestsite.local, then you will need to define the `JETPACK_DEV_DEBUG` constant.
	
	You can also enable Jetpack’s offline mode through a plugin, thanks to the jetpack_offline_mode filter:
	
	`add_filter( 'jetpack_offline_mode', '__return_true' );`
	
	While in Offline Mode, some features will not be available at all as they require WordPress.com for all functionality—Related Posts and Publicize, for example. Other features will have reduced functionality to give developers a good-faith representation of the feature. For example, Tiled Galleries requires the WordPress.com Photon CDN; however, in Offline Mode, Jetpack provides a fallback so developers can have a similar experience during development and testing. Find out more in [our support documentation](https://jetpack.com/support/jetpack-for-developers/).

* ### JETPACK__SANDBOX_DOMAIN

	External contributors do not need this constant.
	If you’re working on changes to the WordPress.com/server side of Jetpack, you’ll need to instruct your Jetpack installation to talk to your development server. Refer to internal documentation for detailed instructions.
