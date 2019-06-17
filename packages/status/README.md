# Jetpack Status

A status class for Jetpack.

Used to retrieve information about the current status of Jetpack and the site overall.

### Usage

Find out whether the site is in development mode:

```php
use Automattic\Jetpack\Status;

$is_development_mode = Status::is_development_mode();
```
