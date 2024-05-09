# Development guide

## Table of contents

* [Prerequisite](#prerequisite)
* [Development Environment - Boost specific information](#development-environment---boost-specific-information)
	* [Setting up your environment](#setting-up-your-environment)
	* [Build the project](#build-the-project)
	* [PHP unit tests](#php-unit-tests)
	* [JavaScript unit tests and e2e tests](#javascript-e2e-tests)
	* [Linting Jetpack Boost's PHP code](#linting-jetpack-boost-php-code)
	* [Linting Jetpack Boost's JavaScript code](#linting-jetpack-boost-javascript-code)
* [Module architectural overview 101](#module-architectural-overview-101)
	* [Creating a new module](#creating-a-new-module)
* [Hooks and filters](#hooks-and-filters)
	* [Critical CSS](#critical-css)
	* [Render Blocking JS](#render-blocking-js)
	* [Enabling/disabling modules and modules availability](#enabling/disabling-modules-and-modules-availability)

# Prerequisite

If you have not yet done so, please review first all of the [Jetpack Monorepo documentation](https://github.com/Automattic/jetpack/tree/trunk/docs) documentation. It does provide all the required information to get you started and acquainted with the different processes.

The following sections will just highlight some additional tips information specific to Jetpack Boost.

# Development Environment - Boost specific information

## Setting up your environment

Because Jetpack Boost as some feature which requires connection to WordPress.com, it is highly recommended that you are running your WordPress site using the [Docker setup](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md) with the [Jurassic Tube Tunneling Service](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#jurassic-tube-tunneling-service) or [Ngrok](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#using-ngrok-with-jetpack).

If not, you might need as a prerequisite to bypass the Jetpack connection.

## Build the project

You may also need building the Image CDN Jetpack Package dependency using the following command:

  ```sh
  jetpack build packages/image_cdn
  ```

You may need to do this only once.


## PHP unit tests

You can run the tests locally:

```sh
cd projects/plugins/boost
composer test-php
```

Or you might also choose to run them inside Docker if you are using it as your development environment:

```sh
jetpack docker exec -- sh -c "composer -d wp-content/plugins/boost test-php"
```

## JavaScript e2e tests

Please refer to the Jetpack Boost e2e tests specific [documentation](../tests/e2e/README.md).

## Linting Jetpack Boost PHP code

Note that the following 3 commands need to be run from the root directory of the Jetpack Monorepo project.

To check coding standards issues on the Jetpack Boost PHP code base run:

  ```sh
  composer phpcs:lint ./projects/plugins/boost
  ```

To automatically fix some coding standards issues on the Jetpack Boost PHP code base run:

  ```sh
  composer phpcs:fix ./projects/plugins/boost
  ```

To check for PHP code compatibility run:

  ```sh
  composer phpcs:compatibility ./projects/plugins/boost
  ```

## Linting Jetpack Boost JavaScript code
The following commands need to be run from the `projects/plugins/boost` directory.

To check syntax and style in the all the TypeScript and Svelte files that Jetpack Boost relies on, you can run:

  ```sh
  pnpm lint
  ``` 


To automatically fix some JavaScript related issues, you can run:

  ```sh
  pnpm lint:fix
  ``` 

---


# Module architectural overview 101

The Jetpack Boost plugin implements a custom [module system](https://github.com/Automattic/jetpack/tree/trunk/projects/plugins/boost/app/modules) for optional modules.

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

namespace Automattic\Jetpack_Boost\Features\Optimizations\Foo;

use Automattic\Jetpack_Boost\Features\Optimizations\State;

/**
 * Class Foo
 */
class Foo extends State {

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

Every available modules are getting [instanciated](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/boost/app/class-jetpack-boost.php#L234) in the [prepare_modules](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/boost/app/class-jetpack-boost.php#L234) method of the [Jetpack Boost class](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/boost/app/class-jetpack-boost.php).

Check out the inline documentation in the [Module class](https://github.com/Automattic/jetpack/blob/trunk/projects/plugins/boost/app/modules/class-module.php) for methods you can optionally override to support extra functionality like REST API endpoints.

# Hooks and filters

## Output Filter

### Filter the output buffer (Critical CSS)

Filter hook: `jetpack_boost_output_filtering_last_buffer`

* Parameter string `$joint_buffer`: The entire output buffer
* Parameter string `$buffer_start`: The top half of the buffer
* Parameter string `$buffer_end`: The bottom half of the buffer

Usage:
```php
add_filter( 'jetpack_boost_output_filtering_last_buffer', function( $joint_buffer, $buffer_start, $buffer_end ) {
    return $joint_buffer;
}, 10, 3 );
```
