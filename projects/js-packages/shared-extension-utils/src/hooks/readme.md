# useAnalytics() hook

This wrapper for @automattic/jetpack-analytics provides a way to use the analytics library (Tracks) in a React component inside your plugin.

This library is only useful when the logged in user is connected to WordPress.com.

## Usage

```es6
const { tracks } = useAnalytics();

tracks.recordEvent( 'jetpack_editor_block_upgrade_click', {
	plan,
	block: blockName,
	context,
} );
```
