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
	* [Bypassing the Jetpack connection](#bypassing-the-jetpack-connection)

# Prerequisite

If you have not yet done so, please review first all of the [Jetpack Monorepo documentation](https://github.com/Automattic/jetpack/tree/trunk/docs) documentation. It does provide all the required information to get you started and acquainted with the different processes.

The following sections will just highlight some additional tips information specific to Jetpack Boost.

# Development Environment - Boost specific information

## Setting up your environment

Because Jetpack Boost as some feature which requires connection to WordPress.com, it is highly recommended that you are running your WordPress site using the [Docker setup](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md) with the [Jurassic Tube Tunneling Service](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#jurassic-tube-tunneling-service) or [Ngrok](https://github.com/Automattic/jetpack/blob/trunk/tools/docker/README.md#using-ngrok-with-jetpack).

If not, you might need as a prerequisite to [bypass the Jetpack connection](#bypassing-the-jetpack-connection).

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

## Config

### Filter the path to the distributed assets folder.

Filter hook: `jetpack_boost_asset_internal_path`

* Parameter string `$path`: the path, "app/assets/dist/".

Usage:
```php
add_filter( 'jetpack_boost_asset_internal_path', function( $path ) {
        return $path;
    }
);
```

### Filters the URL to the distributed assets folder.

Filter hook: `jetpack_boost_asset_url`

* Parameter string `$url`: the URL to the file.
* Parameter string `$min_path`: the minified path.
* Parameter string `$non_min_path`: the non-minified path.

Usage:
```php
add_filter( 'jetpack_boost_asset_url', function( $url, $min_path, $non_min_path ) {
    return $url;
}, 10, 3 );
```

## Menu

### Modify the number of problems shown in the Boost sidebar menu

Filter hook: `jetpack_boost_total_problem_count`

* Parameter integer `$count`: the number of problems

Usage:
```php
add_filter( 'jetpack_boost_total_problem_count', function( $count ) {
        return $count;
    }
);
```

## Critical CSS

### Filter the loading method for each stylesheet. It's either async or deferred.

Filter hook: `jetpack_boost_async_style`:

* Parameter string `$method`: async or deferred.
* Parameter string `$handle`: the stylesheet's registered handle.
* Parameter string `$media`:  the stylesheet's media attribute.

Usage:
```php
add_filter( 'jetpack_boost_async_style', function( $method, $handle, $media ) {
    return $method;
}, 10, 3 );
```

### Filter the post types that need critical css.

Filter hook: `jetpack_boost_critical_css_post_types`

* Parameter array `$post_types`: the post types to be filtered.

Usage:
```php
add_filter( 'jetpack_boost_critical_css_post_types', function( $types) {
        return $types;
    }
);
```

## Render Blocking JS

### Set up the ignore attribute

Filter hook: `jetpack_boost_render_blocking_js_ignore_attribute`

* Parameter string `$attribute`: the attribute used to ignore blocking. Default value: "data-jetpack-boost"

Usage:
```php
add_filter( 'jetpack_boost_render_blocking_js_ignore_attribute', function( $attribute ) {
        return $attribute;
    }
);
```

### Filter to provide an array of registered script handles that should not be moved to the end of the document.

Filter hook: `jetpack_boost_render_blocking_js_exclude_handles`

* Parameter array `$handles`: an array of script handles

Usage:
```php
add_filter( 'jetpack_boost_render_blocking_js_exclude_handles', function( $handles ) {
        return $handles;
    }
);
```

### Filter to remove any scripts that should not be moved to the end of the document.

Filter hook: `jetpack_boost_render_blocking_js_exclude_scripts`

* Parameter array: Alter the array and remove any scripts that should not be moved to the end of the document.

Usage:
```php
add_filter( 'jetpack_boost_render_blocking_js_exclude_scripts', function( $scripts ) {
        return $scripts;
    }
);
```

## Enabling/disabling modules and modules availability

## Bypassing the Jetpack connection

Filter hook: `jetpack_boost_connection_bypass`

* Paramter integer `$connected`: return true to fake a connected state. This is useful for debugging and also on WordPress.com

Usage:
```php
add_filter( 'jetpack_boost_connection_bypass', function( $connected ) {
        return $connected;
    }
);
```

Filter hook: `jetpack_boost_connection_user_data`

* Parameter object `$user_data`: return an object with the following shape can help fake out user data, or provide an alternative user identity, e.g. on WordPress.com.

Usage:
```php
// provide local user data and don't allow disconnecting
add_filter( 'jetpack_boost_connection_user_data', function ( $user ) {
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
);
```

## Critical CSS Viewport Filters

These filters are used for testing purposes.

### Filter the viewport size

Filter hook: `jetpack_boost_viewport_size`

* Parameter array `$data`: array containing the width and height of the view port
* Parameter string `$cookie_name`: Name of the viewport cookie
* Parameter string `$cookie_value`: value of the viewport cookie

Usage:
```php
add_filter( 'jetpack_boost_viewport_size', function( $data, $cookie_name, $cookie_value ) {
    return $data;
}, 10, 3 );
```

### Filter the default viewport sizes

Filter hook: `jetpack_boost_critical_css_viewport_sizes`

* Parameter array `$viewport_sizes`: supported viewport sizes

Usage:
```php
add_filter( 'jetpack_boost_critical_css_viewport_sizes', function( $sizes ) {
    return $sizes;
} );
```

### Filter the default viewport devices

Filter hook: `jetpack_boost_critical_css_default_viewports`

* Parameter array `$viewport_devices`: supported viewport devices

Usage:
```php
add_filter( 'jetpack_boost_critical_css_default_viewports', function( $devices ) {
    return $devices;
} );
```

### Filter the best viewport

Filter hook: `jetpack_boost_pick_viewport`

* Parameter array `$best_size`: the narrowest defined viewport that is equal or wider than the passed width.
* Parameter integer `$width`: the width of the viewport
* Parameter integer `$height`: the height of the viewport
* Parameter array `$viewport_sizes`: an array of viewport sizes

Usage:
```php
add_filter( 'jetpack_boost_pick_viewport', function( $best_size, $width, $height, $viewport_sizes ) {
    return $best_size;
}, 10, 4 );
```

## Features

### Filter the "has feature" check to enable or disable a feature

Filter hook: `jetpack_boost_has_feature_{$feature}`

* Parameter bool `$has_feature`: true if feature available

Usage:
```php
add_filter( 'jetpack_boost_has_feature_' . $feature, function( $has_feature ) {
    return $has_feature;
} );
```
