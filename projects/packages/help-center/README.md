# Help Center

The Help Center package provides the PHP backend used to load the WordPress.com Help Center on WordPress sites. It enqueues the frontend bundles from `widgets.wp.com`, exposes the `helpCenterData` bootstrap payload, and registers the `/help-center` REST API proxy endpoints.

The frontend is maintained in the Calypso repository under `packages/help-center` and `apps/help-center`.

## Installation

Require the Composer package:

```bash
composer require automattic/jetpack-help-center
```

Initialize it on WordPress's `init` hook:

```php
use Automattic\Jetpack\Help_Center\Help_Center;

add_action( 'init', array( Help_Center::class, 'init' ), 10, 0 );
```

The package expects the consuming plugin to load its Composer autoloader. Jetpack Autoloader is recommended when multiple plugins may ship Jetpack packages.

### Public Frontend Surfaces

Consumers can opt a frontend request into the existing logged-out Help Center
bundle. The package continues to own variant selection and asset loading:

```php
add_filter(
	'jetpack_help_center_should_load_logged_out',
	static function ( $should_load ) {
		return is_front_page() || $should_load;
	}
);
```

### Custom WordPress.com Authentication

By default, the package sends logged-in WordPress.com requests through Jetpack
Connection and logged-out requests anonymously. Consumers with another
authentication system can implement `Wpcom_Request_Client` and provide it before
Help Center initializes:

```php
use Automattic\Jetpack\Help_Center\Wpcom_Request_Client;

final class My_Help_Center_Request_Client implements Wpcom_Request_Client {
	public function is_user_connected() {
		return my_wpcom_access_token() !== null;
	}

	public function request(
		$path,
		$version = '2',
		$args = array(),
		$body = null,
		$base_api_path = 'wpcom'
	) {
		if ( is_user_logged_in() ) {
			return my_authenticated_wpcom_request( $path, $version, $args, $body, $base_api_path );
		}

		return my_anonymous_wpcom_request( $path, $version, $args, $body, $base_api_path );
	}
}

add_filter(
	'jetpack_help_center_wpcom_request_client',
	static function () {
		return new My_Help_Center_Request_Client();
	}
);
```

Standalone consumers may instead pass the client directly to `Help_Center::init()`.

## Features

- Loads Help Center bundles in wp-admin, the block editor, the customizer, and supported frontend contexts.
- Adds the Help Center entry point to the WordPress admin bar.
- Provides connected and disconnected variants based on Jetpack connection state.
- Registers the `/help-center` REST namespace used by the frontend, including anonymous proxy requests for logged-out users.
- Limits persisted Help Center router history to 50 entries.

## Development

Run the PHP test suite from the Jetpack monorepo:

```bash
pnpm jetpack test php packages/help-center
```

Frontend JS and CSS changes belong in Calypso and are deployed to `widgets.wp.com`. PHP changes require a release of this package and an update to the consuming plugin.

## Security

Need to report a security vulnerability? Go to [Automattic's security page](https://automattic.com/security/) or the [Automattic HackerOne program](https://hackerone.com/automattic).

## License

jetpack-help-center is licensed under the [GNU General Public License v2 or later](./LICENSE.txt).
