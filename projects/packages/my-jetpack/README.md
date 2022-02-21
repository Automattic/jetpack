# my-jetpack

WP Admin page with information and configuration shared among all Jetpack stand-alone plugins

## Usage

Every Jetpack plugin must include the My Jetpack package.

Require this package and initialize it:

```PHP
add_action( 'init', function() {
	Automattic\Jetpack\My_Jetpack\Initializer::init();
} );
```

### Conditionally loading My Jetpack behind a feature flag

Initialize My Jetpack passing `true` to `init()` instead: 

```PHP
add_action( 'init', function() {
	Automattic\Jetpack\My_Jetpack\Initializer::init( true );
} );
```

Define the `JETPACK_ENABLE_MY_JETPACK` constant as true:

```php
defined( 'JETPACK_ENABLE_MY_JETPACK' ) || define( 'JETPACK_ENABLE_MY_JETPACK', true );
```

### Conditionally loading My Jetpack via a filter

Set `jetpack_my_jetpack_should_initialize` to return false for avoiding the initialization of My Jetpack..

```
add_filter( 'jetpack_my_jetpack_should_initialize', '__return_false' );
```

That's all!

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

my-jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)

