# Jetpack Device Detection

A method to detect device types, originates from `jetpack_is_mobile`.



### Usage

Retrieve device information.

```php
use Automattic\Jetpack\Device_Detection;

$device_info = Device_Detection::get_info();

/**
 * array(
 *  'is_phone'            => (bool) Whether the current device is a mobile phone.
 *  'is_smartphone'       => (bool) Whether the current device is a smartphone.
 *  'is_tablet'           => (bool) Whether the current device is a tablet device.
 *  'is_handheld'         => (bool) Whether the current device is a handheld device.
 *  'is_desktop'          => (bool) Whether the current device is a laptop / desktop device.
 *  'platform'            => (string) Detected platform.
 *  'is_phone_matched_ua' => (string) Matched UA.
 * );
 */
```

Detect any mobile phone.

```php
use Automattic\Jetpack\Device_Detection;

$is_phone = Device_Detection::is_phone();
```

Detect a smartphone.

```php
use Automattic\Jetpack\Device_Detection;

$is_smartphone = Device_Detection::is_smartphone();
```

Detect a dumbphone.

```php
use Automattic\Jetpack\Device_Detection;

$is_dumbphone = Device_Detection::is_phone() && ! Device_Detection::is_smartphone();
```

Detect a tablet.

```php
use Automattic\Jetpack\Device_Detection;

$is_tablet = Device_Detection::is_tablet();
```

Detect a desktop device.

```php
use Automattic\Jetpack\Device_Detection;

$is_desktop = Device_Detection::is_desktop();
```

Detect any handheld device.

```php
use Automattic\Jetpack\Device_Detection;

$is_handheld = Device_Detection::is_handheld();
```
## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-device-detection is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
