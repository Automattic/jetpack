# Development guide

## Table of contents

* [Prerequisite](#prerequisite)
* [Setting up your environment](#setting-up-your-environment)
* [Development workflow](#development-workflow)
	* [Build the project](#build-the-project)
	* [Accessing WordPress Core files and wp-content](#accessing-wordpress-core-files-and-wp-content)
* [Unit Testing](#unit-testing)
	* [PHP unit tests](#php-unit-tests)
	* [JavaScript unit tests and e2e tests](#javascript-unit-tests-and-e2e-tests)
* [Good code - linting, standards, compatibility, etc.](#good-code---linting-standards-compatibility-etc)
	* [Coding standards](#coding-standards)
	* [Linting](#linting)
* [Standard development & debugging tools](#standard-development--debugging-tools)
* [Pull requests workflow](#pull-requests-workflow)
* [Release process](#release-process)
* [Module architectural overview 101](#module-architectural-overview-101)
* [Hooks and filters](#hooks-and-filters)

# Prerequisite

If you have not yet done so, you might want to review first the [Jetpack Monorepo documentation](https://github.com/Automattic/jetpack/tree/master/docs). 

# Setting up your environment

Please refer to the [Setting up your environment](https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md#setting-up-your-environment) section of the Jetpack Monorepo [Development Environment](https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md#setting-up-your-environment) documentation.

**NOTE**: Because Jetpack Boost as some feature which requires connection to WordPress.com, it is highly recommended that you are running your WordPress site using the [Docker setup](https://github.com/Automattic/jetpack/blob/master/tools/docker/README.md) with the [Jurassic Tube Tunneling Service](https://github.com/Automattic/jetpack/blob/master/tools/docker/README.md#jurassic-tube-tunneling-service) or [Ngrok](https://github.com/Automattic/jetpack/blob/master/tools/docker/README.md#using-ngrok-with-jetpack).

If not, you might need as a prerequisite to [bypass the Jetpack connection](#bypassing-the-jetpack-connection).

# Development workflow

Once you have done the setup and have all development tools installed, you can start developing Jetpack Boost.

1. Make sure that Jetpack Boost is activated on your WordPress site.
2. [Build the Jetpack Boost project](#build-the-project).
3. Go to the Jetpack Boost admin page.

## Build the project

Jetpack Boost requires building PHP, JavaScript, and CSS components. [The Jetpack CLI tool](https://github.com/Automattic/jetpack/blob/master/tools/cli/README.md) will help you with all building steps.

Note that all the building step you can be done from the `projects/plugins/boost` directory.

There are 2 different types of builds:

- Development build

  A standard development build will create un-minified versions of the JavaScript and CSS files.

  It will also install all the Composer dependencies.

  To build the project, run:

    ```sh
    jetpack build plugins/boost
    ```

  Alternatively you could also use the [pnpm](https://pnpm.io/) `run` command inside the `projects/plugins/boost` directory:

  ```sh
  pnpm run build-development
  ```

- Continuous Development build

  By default the development build above will run once and if you change any of the JavaScript/CSS files, you need to run jetpack build again to see the changes on the site. If you want to avoid that, you can run a continuous build that will rebuild anytime it sees any changes on your local filesystem. To run it, use:

  ```sh
  jetpack watch plugins/boost
   ```

  Alternatively you can also use the [pnpm](https://pnpm.io/) `run` command inside the `projects/plugins/boost` directory:

  ```sh
  pnpm run dev
  ```

- **Additional Note**

  You may also need building the Lazy Images Jetpack Package dependency (used by the Lazy Image Loading module) using the following command:

  ```sh
  jetpack build packages/lazy-images
  ```

  You may need to do this only once.

## Accessing WordPress Core files and wp-content

If you are using the Docker setup, you can find the WordPress core files as well as the `wp-content` folder under the `tools/docker/wordpress` directory from the root of this Jetpack Monorepo.

# Unit testing

The Jetpack Boost plugin includes several [unit tests](https://github.com/Automattic/jetpack/tree/master/projects/plugins/boost/tests) that you can run in your local environment before submitting a new Pull Request.

To get started, there are several ways to run the unit tests, depending on how you set up your development environment.

## PHP unit tests

You can run the tests locally, from within the Jetpack Boost directory:

```sh
cd projects/plugins/boost
composer phpunit
```

Or you might also choose to run them inside Docker if you are using it as your development environment:

```sh
jetpack docker sh # This will get you inside the WordPress docker container
composer -d wp-content/plugins/boost phpunit
```

## JavaScript unit tests and e2e tests

For the time being there are no usable JavaScript tests and there is a [Github issue](https://github.com/Automattic/jetpack/issues/20615) opened to resolve this.

# Good code - linting, standards, compatibility, etc.

## Coding standards

We strongly recommend that you install tools to review your code in your IDE. It will make it easier for you to notice any missing documentation or coding standards you should respect. Most IDEs display warnings and notices inside the editor, making it even easier.

- Jetpack's custom Code Sniffer ruleset is located at `./projects/packages/codesniffer/Jetpack/ruleset.xml`. You can use this path to set up Jetpack's custom ruleset in your IDE.
- For JavaScript, we recommend installing ESLint. Most IDEs come with an ESLint plugin that you can use. Jetpack includes a `.eslintrc.js` file that defines our coding standards.


## Linting

* ### Linting Jetpack Boost's PHP code

  You can easily run these commands to set up all the rulesets and then lint Jetpack Boost's PHP code.

  First, you need Composer to run this tool so check how to [install Composer](https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md#composer) if you don't have it yet.

  Second you also need to install the Jetpack Monorepo CodeSniffer rulesets you may need to do this only once from the **root** of the Jetpack Monorepo.

  ```sh
  composer install
  ```

  The following commands need to be run from the `projects/plugins/boost` directory.

  To check coding standards issues on the Jetpack Boost PHP code base run:

  ```sh
  composer phpcs:lint
  ```

  To automatically fix some coding standards issues on the Jetpack Boost PHP code base run:

  ```sh
  composer phpcs:fix
  ```

* ### Checking Jetpack Boost's PHP for compatibility with different versions of PHP since 5.6

  There is a handy `composer` script (to be run from `projects/plugins/boost`) that will just run the PHP CodeSniffer `PHPCompatibilityWP` ruleset checking for code not compatible with PHP 5.6:

  ```sh
  composer phpcs:compatibility
  ```

* ### Linting Jetpack Boost's JavaScript

  The following commands need to be run from the `projects/plugins/boost` directory.

  `pnpm lint:js` will check syntax and style in the following JavaScript pieces:

	* All the front end JavaScript that Jetpack Boost relies on.
	* All the JavaScript present in the Admin Page Single Page App for Jetpack Boost.

  ```sh
  pnpm lint:js
  ```

  To automatically fix some JavaScript related issues, you can run:

  ```sh
  pnpm lint:js:fix
  ``` 

  _If you haven't done it yet, you may need to run `pnpm install` before `pnpm lint:js` for installing node modules for this task_.

* ### Additional handy commands

  The following commands need to be run from the `projects/plugins/boost` directory.

  You can actually run all the PHP and JavaScript linting commands using:

  ```sh
  pnpm lint # or pnpm lint:fix
  ``` 

  You can also run the PHP linting commands using `pnpm` commands such as:

	- `pnpm lint:php`
	- `pnpm lint:php:fix`
	- `pnpm lint:php:compatibility`

---

# Standard development & debugging tools

You can find some information about this topic on the [Standard development & debugging tools](https://github.com/Automattic/jetpack/blob/master/docs/development-environment.md#standard-development--debugging-tools) section of the Jetpack Monorepo documentation.

## Other tips and tools

These are relevant if you are using the [Docker environment setup](https://github.com/Automattic/jetpack/blob/master/tools/docker/README.md).

- Uou can find your `wp-config.php` file at `tools/docker/wordpress/wp-config.php` from the root of the Jetpack Monorepo.
- You can tail the debug.log file using the `jetpack docker tail` command.
- You can run the WP-CLI command using the `jetpack docker wp` command.
- You can enter the WordPress Docker container using the `jetpack docker sh` command.
- You can access the access MySQL CLI using the `jetpack docker db` command.
- You can access phpMyAdmin at [http://localhost:8181](http://localhost:8181).

---

# Pull requests workflow

Before pushing a working branch to raise a Pull Request, make sure that all the code is passing the cosing standards checks and that the unit tests are also passing.

You will also need to include a new [changelog entry](https://github.com/Automattic/jetpack/tree/master/projects/plugins/boost/changelog). You can do this using the following command and follow the guided steps:

```sh
jetpack changelog
```

# Release process

This is currently not publicly documented. If you are looking at deploying, you are most likely an Automattician and you can reach out to the Jetpack Ground Control crew for support.

---

# Module architectural overview 101

The Jetpack Boost plugin implements a custom [module system](https://github.com/Automattic/jetpack/tree/master/projects/plugins/boost/app/modules) for optional modules.

## Creating a new module

To create a new module (example: `foo`) and enable it in the plugin, please follow these steps. Replace all instances of `foo` by your module name:

1.  Create `/app/modules/foo/class-foo.php`.

The bare-bones module template can look like:

```php
<?php
/**
 * Implements the Foo feature.
 *
 * @link       https://automattic.com
 * @since      1.0.0
 */

namespace Automattic\Jetpack_Boost\Modules\Foo;

use Automattic\Jetpack_Boost\Modules\Module;

/**
 * Class Foo
 */
class Foo extends Module {

	/**
	 * Code to run when module is started
	 */
	protected function on_initialize() {
        // Add any code here
	}
}
```

2.  Add `foo` to the array in `AVAILABLE_MODULES_DEFAULT` method in `class-jetpack-boost.php` to make it available.

3.  Add `foo` to the array in `ENABLED_MODULES_DEFAULT` method in `class-jetpack-boost.php` to make it enabled by default if wanted.

Every available modules are getting [instanciated](https://github.com/Automattic/jetpack/blob/master/projects/plugins/boost/app/class-jetpack-boost.php#L234) in the [prepare_modules](https://github.com/Automattic/jetpack/blob/master/projects/plugins/boost/app/class-jetpack-boost.php#L234) method of the [Jetpack Boost class](https://github.com/Automattic/jetpack/blob/master/projects/plugins/boost/app/class-jetpack-boost.php).

Check out the inline documentation in the [Module class](https://github.com/Automattic/jetpack/blob/master/projects/plugins/boost/app/modules/class-module.php) for methods you can optionally override to support extra functionality like REST API endpoints.

# Hooks and filters

## Critical CSS

-   `jetpack_boost_critical_css_skip_url`: Skip generating critical CSS for a URL. By default, we skip URLs that are 404 pages.

## Render Blocking JS

-   `jetpack_boost_render_blocking_js_exclude_handles`: Provide an array of registered script handles that should not be moved to the end of the document.
-   `jetpack_boost_render_blocking_js_exclude_scripts`: Alter the array and remove any scripts that should not be moved to the end of the document.

## Enabling/disabling modules and modules availability

- `jetpack_boost_module_enabled` provides a default status, true/false, and feature slug (e.g. `critical-css`). Returning `true` will force a module on, `false` will force it off, regardless of the configuration variable.

```php
	// force critical CSS on
	add_filter( 'jetpack_boost_module_enabled', function( $status, $feature ) {
		if ( 'critical-css' === $feature ) {
			return true;
		}
		return $status;
	}, 10, 2 );
```

- `jetpack_boost_modules` filters the available list of modules.

```php
	// exclude minify module from available modules
	add_filter( 'jetpack_boost_modules', function( $modules ) {
		if (($key = array_search('minify' , $modules)) !== false) {
			unset($modules[$key]);
		}
		return $modules;
	} );
```

## Bypassing the Jetpack connection

Filtering `jetpack_boost_connection_bypass` and returning `true` will fake a connected state. This is useful for debugging, and also on WordPress.com.

Filtering `jetpack_boost_connection_user_data` and returning an object with the following shape can help fake out user data, or provide an alternative user identity, e.g. on WordPress.com.

```php
// provide local user data and don't allow disconnecting
add_filter(
	'jetpack_boost_connection_user_data',
	function ( $user ) {
		$wpcomUser = array(
			'ID' => 1234,
			'login' => 'fakewpcomuser',
			'email' => 'fakewpcomuser@example.com',
			'display_name' => 'Fake WPCOM User',
			'text_direction' => 'ltr',
			'site_count' => 1,
			'jetpack_connect' => 1,
			'avatar' => 'http://example.com/avatar.png',
		);

		return [
			'wpcomUser' => $wpcomUser,
			'isPrimaryUser' => false,
			'canDisconnect' => false,
		];
	}
);```
