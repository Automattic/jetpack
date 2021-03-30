## 9.6

### Before you start

- If you have the opportunity to test in an older browser like IE11, please do so. You may catch some interesting bugs!
- **At any point during your testing, remember to [check your browser's JavaScript console](https://codex.wordpress.org/Using_Your_Browser_to_Diagnose_JavaScript_Errors#Step_3:_Diagnosis) and see if there are any errors reported by Jetpack there.**
- Use "Debug Bar" or "Query Monitor" to help make PHP notices and warnings more noticeable and report anything you see.

### Blocks

### Password Checker
* Check the `password-checker` [README.md](https://github.com/Automattic/jetpack/blob/master/projects/packages/password-checker/README.md) for more in-depth examples.

Usage:
```php
use Automattic\Jetpack\Password_Checker;

$user = new WP_User( 1 );
$password_checker = new Password_Checker( $user );
$password_checker->test( '123', true );
```

**Thank you for all your help!**
