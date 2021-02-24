# Password Checker

Password Checker package.

### Usage

Test a password:

```php
use Automattic\Jetpack\Password_Checker;

$password_checker = new Password_Checker( $user );
$password_checker->test( '123', true );
```
