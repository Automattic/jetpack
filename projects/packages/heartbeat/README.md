# Jetpack Heartbeat Package

Sends a daily batch of stats to WP.com using the A8C MC Stats package.

These are internal usage stats for Automattic, not visible to site owners.

## Usage

### 1. Make sure Hearbeat is initialized:

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
