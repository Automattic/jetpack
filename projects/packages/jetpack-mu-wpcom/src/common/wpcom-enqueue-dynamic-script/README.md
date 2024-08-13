# WPCOM Enqueue Dynamic Script

This plugin defines the `WPCOM_Enqueue_Dynamic_Script` class which allows for scripts and dependencies in PHP to be loaded dynamically via a JS callback.
This handles not only the registered scripts but also their dependencies, before's, after's, and translations. Dependencies will be loaded in parallel, but executes them in the expected order. 
Note that the scripts that are added inline (eg via `wp_add_inline_script`) are inlined in the HTML statically in a disabled state until the main script that owns them is loaded. Meaning they won't be loaded lazily like the main script.

## Methods

### `enqueue_script`

Adds the registered script to the frontend via inline `disabled` script along with the JS orchestration scripts.

#### Parameters

- `$handle` string: The handle of the registered script you would like to enqueue dynamically.

### `dequeue_script`

Removes the registered script from being inlined. This will not remove the JS orchestration scripts or remove already inlined scripts.

#### Parameters

- `$handle` string: The handle of the registered script you would like to enqueue dynamically.

### `reset`

Removes all registered scripts from being inlined and removes the JS orchestration scripts.

## Usage

`WPCOM_Enqueue_Dynamic_Script` pulls from the registered scripts. Therefore you first need to register your script and then call enqueue. Once this is done you can use the JS function to load on demand.

### PHP - registering and enqueueing

```php
<?php
// Register
wp_register_script( 'verbum', '../../build/verbum-comments/verbum-comments.js', array( 'strategy'  => 'defer', 'in_footer' => true, ), '1.0.1', true );

// Enqueue
WP_Enqueue_Dynamic_Script::enqueue_script( 'verbum' );
```

### JavaScript - loading when needed

The script returns a promise so you can have follow up actions.

```javascript
WP_Enqueue_Dynamic_Script.loadScript( 'verbum' ).then(
	// Celebrate because you saved a lot of bytes on your page load!
	doDance();
);
```