# Jetpack Status

A status class for Jetpack.

Used to retrieve information about the current status of Jetpack and the site overall.

### Usage

Find out whether the site is in offline mode:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_offline_mode = $status->is_offline_mode();
```

Find out whether this is a system with multiple networks:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_multi_network = $status->is_multi_network();
```

Find out whether this site is a single user site:

```php
use Automattic\Jetpack\Status;

$status = new Status();
$is_single_user_site = $status->is_single_user_site();
```
