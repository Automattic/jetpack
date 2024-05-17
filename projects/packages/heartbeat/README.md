# Jetpack Heartbeat Package

Sends a daily batch of stats to WP.com using the A8C MC Stats package.

These are internal usage stats for Automattic, not visible to site owners.

## Usage

### 1. Make sure Heartbeat is initialized:

```php
Automattic\Jetpack\Heartbeat::init();
```

### 2. Add your stats to the heartbeat

Add a filter callback:

```php
add_filter( 'jetpack_heartbeat_stats_array', 'my_callback' );
```

In your callback, add the stats you want to the array with new key => value pairs where:
* key is the stat group name
* value is the stat name.

```php
function my_callback( $stats ) {
	$stats['my-plugin'] = 'active';
	return $stats;
}
```

This will bump the stats for the 'my-plugin/active' stat.

And that's all!

Now your stats will be added to the batch of stats that are bumped once a day.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-heartbeat is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
