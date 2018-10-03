# Development Environment

The javascript and CSS components of this plugin's admin interface need to be built in order to get the runtime bundle (`_inc/build/admin.js`)

**Recommended Environment**

* Node.js 10
* Yarn 1.7

## A note on Node versions used for the build tasks

We try to frequently keep the Node version we use up to date. So, eventually you may need to refresh your package dependencies (i.e., the `node_modules` directories). This is because some dependencies are built specifically for the Node version you used when you installed them (either by running `yarn build` or `yarn`).

We recommend usage of [nvm](https://www.npmjs.com/package/nvm) for managing different Node versions on the same environment.

**Note:** If you have previously run the Jetpack build tasks (e.g. `yarn build`), and didn't come back to it for a long time, you can
run this command before building again. Otherwise you may experience errors on the command line while trying to build.

```
$ yarn distclean
```

**Start Development**

1. Make sure you have `git`, `node`, `npm`, and a working WordPress installation.
2. Clone this repository inside your Plugins directory.

	```
	$ git clone https://github.com/Automattic/jetpack.git
	$ cd jetpack
	```

3. Install yarn

Please, refer to yarn's [Installation Documentation](https://yarnpkg.com/docs/install/).

4. Make sure the Jetpack plugin is active and run

	```
	$ yarn build
	```

	This will install npm dependencies and then build the files.

5. Open `/wp-admin/admin.php?page=jetpack` in your browser.

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

## Use PHP CodeSniffer and ESLint to make sure your code respects coding standards

We strongly recommend that you install tools to review your code in your IDE. It will make it easier for you to notice any missing documentation or coding standards you should respect. Most IDEs display warnings and notices inside the editor, making it even easier.

- You can find [Code Sniffer rules for WordPress Coding Standards](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#installation) here. Once you've installed these rulesets, you can [follow the instructions here](https://github.com/WordPress-Coding-Standards/WordPress-Coding-Standards#how-to-use) to configure your IDE.
- For JavaScript, we recommend installing ESLint. Most IDEs come with an ESLint plugin that you can use. Jetpack includes a `.eslintrc.js` file that defines our coding standards.

### Linting Jetpack's PHP

You can easily run these commands to set up all the rulesets and then lint Jetpack's PHP code:

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

### Checking Jetpack's PHP for PHP 5.2 Compatibility

We have a handy `composer` script that will just run the PHP CodeSniffer `PHPCompatibilityWP` ruleset checking for code not compatible with PHP 5.2

```sh
$ composer php:5.2-compatibility .
```

_There's also a handy `yarn php:5.2-compatibility` that will run `composer php:5.2-compatibility` if you prefer_.

```sh
$ yarn php:5.2-compatibility .
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
