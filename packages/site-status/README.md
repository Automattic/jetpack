# Jetpack Site Status

A site status class for Jetpack.

Used to retrieve information about the current status of the site.

### Usage

Find out whether the site is in development mode:

```php
use Automattic\Jetpack\Site_Status;

$is_development_mode = Site_Status::is_development_mode();
```
