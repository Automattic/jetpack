# Developers

WIP

## Architectural overview 101

The Jetpack Boost plugin implements a custom [module system](https://github.com/Automattic/jetpack/tree/master/projects/plugins/boost/app/modules) for optional modules. Every module is just a PHP file that [is required](https://github.com/Automattic/jetpack-boost/blob/df0070ee7375ff0a84351efe5bc53d3d0a67ed5d/app/class-jetpack-boost.php#L107-L129) during plugin initialization.

### Creating a new module

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

Check out the inline documentation in the [Module class](https://github.com/Automattic/jetpack/blob/master/projects/plugins/boost/app/modules/class-module.php) for methods you can optionally override to support extra functionality like REST API endpoints.

## Uses `jetpack-connection`

In order to use some functionality provided by WordPress.com and used by Jetpack, a connection between the site and WordPress.com is needed. The package providing connection capability is called `jetpack-connection`.

In order to use the Jetpack connection and WPCOM API for API calls, set this filter: `add_filter('jetpack_boost_use_wpcom_api', '__return_true');`

## Hooks and filters

### Enabling/disabling modules and modules availability

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

### Bypassing the Jetpack connection

Filtering `jetpack_boost_connection_bypass` and returning `true` will fake a connected state. This is useful for debugging, and also on WordPress.com.

Filtering `jetpack_boost_connection_user_data` and returning an object with the following shape can help fake out user data, or provide an alternative user identity, e.g. on WordPress.com.

```php
// provide local user data and don't allow disconnecting
add_filter( 'jetpack_boost_connection_user_data', function( $user ) {
	$user_data = get_userdata( get_current_user_id() );
	$wpcomUser = array(
		'ID'    => $user_data->ID,
		'login' => $user_data->user_login,
		'email' => $user_data->user_email,
		'display_name' => $user_data->display_name,
		'avatar' => get_avatar_url( $user_data->ID, 64 )
	);

	return [
		'wpcomUser' => $wpcomUser,
		'isPrimaryUser' => false,
		'canDisconnect' => false,
	];
} );
```

### Generating a release branch

You can generate a release branch (branch/$VERSION) by running:

```sh
$ ./bin/generate-release-branch.sh $VERSION
$ # or
$ npm run release:branch -- $VERSION
```

e.g.

```sh
$ ./bin/generate-release-branch.sh 1.0.0-beta3
$ # or
$ npm run release:branch -- 1.0.0-beta3
```

Note that $VERSION must be compatible with [node-semver](https://github.com/npm/node-semver)

The release branch script will:
 * Check if the branch "branch/$VERSION" exists remotely. Bails if it does, create it if it doesn't.
 * Update composer.json with stable, versioned Jetpack DNA dependencies (rather than "dev")
 * Replace existing version numbers in jetpack-boost.php, package.json, composer.json and readme.txt
 * Commit changes and push to branch/$VERSION origin

### Deleting a release branch

Sometimes you mess up and want to delete the generated release branches. You can do this by running:

```sh
$ ./bin/delete-release-branch.sh $VERSION
$ # or
$ npm run release:delete -- $VERSION
```

e.g.

```sh
$ ./bin/delete-release-branch.sh 1.0.0-beta3
$ # or
$ npm run release:delete -- 1.0.0-beta3
```

Note that $VERSION must be compatible with [node-semver](https://github.com/npm/node-semver)

The delete branch script will:
 * Check if the branch "branch/$VERSION" exists remotely, and deletes it if it exists.
 * Check if the branch "branch/$VERSION" exists locally, and deletes it if it exists.

### Generating a release bundle

NOTE: this script is deprecated as it hides modifications in the final build from Git and makes it hard to troubleshoot issues.

You can generate a release zip by running:

```sh
$ ./bin/generate-release-zip.sh [branchname]
$ # or
$ npm run release:build -- [branchname]
```

e.g.

```sh
$ ./bin/generate-release-zip.sh fix/some-issue
$ # or
$ npm run release:build fix/some-issue
```

The release bundle script will:
 * Download a fresh copy from GitHub
 * Install Composer and NPM dependencies
 * Build the assets
 * Create a new zip file in `./release/jetpack-boost-{version}-dist.php`
