# Password Checker

Password Checker package.

### Usage

Add a new test:

```php
$tests = array(
	'preg_match'      => array(
		'no_backslashes' => array(
			'pattern'          => '/^[^\\\\]*$/u',
			'error'            => __( 'Passwords may not contain the character "\".', 'jetpack' ),
			'required'         => true,
			'fail_immediately' => true,
		),
	),
	'compare_to_list' => array(
		'not_a_common_password' => array(
			'list_callback'    => 'get_common_passwords',
			'compare_callback' => 'negative_in_array',
			'error'            => __( 'This is a very common password. Choose something that will be harder for others to guess.', 'jetpack' ),
			'required'         => true,
		),
	)
);
$tests = apply_filters( 'password_checker_tests', $tests );
```

Test a password:

```php
use Automattic\Jetpack\Password_Checker;

$user = new WP_User( 1 );
$password_checker = new Password_Checker( $user );
$password_checker->test( '123', true );
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-password-checker is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
