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
