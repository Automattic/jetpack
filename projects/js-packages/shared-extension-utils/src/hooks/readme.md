# useAnalytics() hook

This wrapper for @automattic/jetpack-analytics provides a way to use the analytics library (Tracks) in a React component inside your plugin.

This library is only useful when the logged in user is connected to WordPress.com, and when we have information about that connection passed to JavaScript via the Jetpack Connection package. Typically, this is done by enqueuing the connection package's initial state on the editor page:

```php
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
// Adds Connection package initial state.
Connection_Initial_State::render_script( 'your-app-script-handle-in-editor' );
```

Adding Tracks related class and including the check function in your admin ui page:
```php
use Automattic\Jetpack\Status as Status;
use Automattic\Jetpack\Terms_Of_Service;
use Automattic\Jetpack\Tracking;

/**
 * Returns whether we are in condition to track to use
 * Analytics functionality like Tracks, MC, or GA.
 */
public static function can_use_analytics() {
	$status     = new Status();
	$connection = new Connection_Manager();
	$tracking   = new Tracking( 'jetpack', $connection );

	return $tracking->should_enable_tracking( new Terms_Of_Service(), $status );
}
```

Then adding the assets in the `enqueue_admin_scripts` function after the `Assets::register_script` function:
```php
public function enqueue_admin_scripts() {
	...
	// Required for Analytics.
	if ( self::can_use_analytics() ) {
		Tracking::register_tracks_functions_scripts( true );
	}
	...
}
```

## Usage

```es6
const { tracks } = useAnalytics();

tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
	plan,
	block: blockName,
	context,
} );
```

The hook function also accepts parameters to record a "page view" event when the component renders.
You can also import a wrapped version of `recordEvent` that checks for a Jetpack connected user before actually recording the event.

```es6
const Component = () => {
	const { recordEvent } = useAnalytics( {
			pageViewEventName: 'view_event_name',
			pageViewNamespace: 'jetpack',
			pageViewSuffix: '',
		} );
	const recordClick = useCallback( () => { recordEvent( 'event_name', {} ) }, [] );

	return (
		<Button
			onClick={ recordClick }
		>
			{ __( 'Action Button', 'jetpack' ) }
		</Button>
	)
}
```
