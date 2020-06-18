# Jetpack Constants

A method to detect mobile devices, formerly jetpack_is_mobile.



### Usage

Detect any mobile phone.

```php
use Automattic\Jetpack\Mobile;

$is_mobile = Mobile::is_mobile();
```

Detect a smartphone.

```php
use Automattic\Jetpack\Mobile;

$is_smartphone = Mobile::is_mobile( 'smart' );
```

Detect a dumbphone and return its UA.

```php
use Automattic\Jetpack\Mobile;

$is_smartphone = Mobile::is_mobile( 'dumb', true );
```
