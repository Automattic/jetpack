# useAnalytics() hook

This wrapper for @automattic/jetpack-analytics provides a way to use the analytics library (Tracks) in a React component inside your plugin.

This library is only useful when the logged in user is connected to WordPress.com, and when we have information about that connection passed to JavaScript via the Jetpack Connection package. Typically, this is done by enqueuing the connection package's initial state on the editor page:

```php
use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
// Adds Connection package initial state.
wp_add_inline_script( 'your-app-script-handle-in-editor', Connection_Initial_State::render(), 'before' );
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
